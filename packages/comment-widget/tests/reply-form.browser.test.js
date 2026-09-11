import { assert, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('Reply form regression checks', async () => {
  const comment = {
    metadata: { name: 'comment-1' },
    spec: {
      content: 'Comment',
      approved: true,
      owner: { kind: 'User', name: 'admin' },
    },
    owner: { displayName: 'Admin' },
    stats: { upvote: 0 },
    status: { visibleReplyCount: 1 },
  };
  let status = 200;
  let approved = true;
  let refreshes = 0;
  let rows = [];
  mockApi(async (input, options = {}) => {
    const posting = options.method === 'POST';
    const url = new URL(String(input), location.href);
    const page = Number(url.searchParams.get('page') || 1);
    const size = Number(url.searchParams.get('size') || 10);
    if (!posting && String(input).includes('/reply')) refreshes++;
    return new Response(
      JSON.stringify(
        posting
          ? { spec: { approved } }
          : {
              items: rows.slice((page - 1) * size, page * size),
              page,
              size,
              total: rows.length,
              hasNext: page * size < rows.length,
            }
      ),
      {
        status: posting ? status : 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
  await import('../src/index.ts');
  for (const withReplies of [true, false]) {
    for (const tag of ['comment-item', 'reply-item']) {
      const item = document.createElement(tag);
      item.comment = comment;
      item.reply = { ...comment, metadata: { name: 'reply-1' } };
      item.configMapData = { basic: { withReplies } };
      let reloads = 0;
      item.addEventListener('reload', () => reloads++);
      document.body.append(item);
      await item.updateComplete;
      for (approved of [true, false]) {
        const button = item.shadowRoot.querySelector(
          tag === 'comment-item' && !withReplies
            ? '.show-replies-button'
            : '.reply-button'
        );
        button.click();
        await item.updateComplete;
        const form = item.shadowRoot.querySelector('reply-form');
        await form.updateComplete;
        form.currentUser = { metadata: { name: 'admin' } };
        const base = form.baseFormRef.value;
        await base.updateComplete;
        await until(() => base.editorRef.value?.editor);
        base.editorRef.value.editor.commands.setContent('<p>Keep my reply</p>');
        await new Promise((resolve) => setTimeout(resolve, 20));
        const submit = () =>
          form.onSubmit(
            new CustomEvent('submit', {
              detail: { content: '<p>Keep my reply</p>' },
              cancelable: true,
            })
          );
        status = 400;
        await submit();
        await item.updateComplete;
        assert(
          form.isConnected && item.showReplyForm,
          'Failure must keep the form open'
        );
        assert(
          base.editorRef.value.editor.getText() === 'Keep my reply',
          'Failure must retain the draft'
        );
        status = 200;
        const previousRefreshes = refreshes;
        await submit();
        await item.updateComplete;
        assert(
          !item.showReplyForm && !form.isConnected,
          'Success must remove the reply form'
        );
        assert(
          item.shadowRoot.activeElement === button,
          'Success must focus the reply button'
        );
        if (tag === 'comment-item') {
          assert(item.showReplies, 'Success must keep replies visible');
          await until(() => refreshes > previousRefreshes);
        } else {
          assert(reloads > 0, 'Success must forward the refresh event');
        }
      }
      item.remove();
    }
  }
  rows = Array.from({ length: 31 }, (_, index) => ({
    ...structuredClone(comment),
    metadata: { name: `reply-${index}` },
  }));
  for (approved of [true, false]) {
    const list = document.createElement('comment-replies');
    list.comment = comment;
    list.configMapData = { basic: { withReplies: false, replySize: 10 } };
    document.body.append(list);
    await until(() => list.replies.length === 10 && !list.loading);
    await list.fetchNext();
    await list.updateComplete;
    const item = list.shadowRoot.querySelectorAll('reply-item')[15];
    await item.updateComplete;
    const button = item.shadowRoot.querySelector('.reply-button');
    button.click();
    await item.updateComplete;
    const form = item.shadowRoot.querySelector('reply-form');
    await form.updateComplete;
    form.currentUser = { metadata: { name: 'admin' } };
    await new Promise((resolve) => setTimeout(resolve, 20));
    await form.onSubmit(
      new CustomEvent('submit', { detail: { content: 'Paged reply' } })
    );
    await until(() => !list.loading);
    await list.updateComplete;
    assert(
      list.replies.length === 20,
      'Reply submission must preserve the loaded range'
    );
    assert(
      item.isConnected && !form.isConnected,
      'Refresh must retain the reply and close its form'
    );
    assert(
      item.shadowRoot.activeElement === button,
      'Focus must survive the parent list refresh'
    );
    await list.fetchNext();
    assert(
      list.replies.length === 30,
      'Load more must continue after the preserved range'
    );
    assert(
      new Set(list.replies.map((reply) => reply.metadata.name)).size === 30,
      'Load more must not duplicate replies'
    );
    list.remove();
  }
});
