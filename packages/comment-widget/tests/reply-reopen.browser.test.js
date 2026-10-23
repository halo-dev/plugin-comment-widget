import { assert, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('reopening replies retains the reply returned by the post-submit refresh', async () => {
  const makeReply = (name) => ({
    metadata: { name },
    spec: {
      content: name,
      approved: true,
      owner: { kind: 'User', name: 'admin' },
    },
    owner: { displayName: 'Admin' },
    stats: { upvote: 0 },
  });
  const list = (items) => ({
    items,
    page: 1,
    size: 10,
    total: items.length,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  });
  const oldReply = makeReply('old-reply');
  const newReply = makeReply('new-reply');
  const comment = {
    ...makeReply('comment-1'),
    status: { visibleReplyCount: 1 },
    replies: list([oldReply]),
  };
  let replyGets = 0;
  mockApi(async (input) => {
    const path = new URL(String(input), location.href).pathname;
    let data = {};
    if (path.endsWith('/globalinfo')) data = { allowAnonymousComments: true };
    else if (path.endsWith('/config'))
      data = {
        basic: { withReplies: true, replySize: 10 },
        avatar: { enable: false },
      };
    else if (path.endsWith('/users/-'))
      data = { user: { metadata: { name: 'anonymousUser' }, spec: {} } };
    else if (path.endsWith('/comments')) data = list([comment]);
    else if (path.endsWith('/reply')) {
      replyGets++;
      data = list([oldReply, newReply]);
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  await import('../src/index.ts');
  const widget = document.createElement('comment-widget');
  document.body.append(widget);
  const getItem = () =>
    widget.shadowRoot
      ?.querySelector('comment-list')
      ?.shadowRoot?.querySelector('comment-item');
  await until(() => getItem()?.shadowRoot?.querySelector('comment-replies'));
  const item = getItem();
  let replies = item.shadowRoot.querySelector('comment-replies');
  await replies.updateComplete;
  assert.equal(replies.replies.length, 1);
  assert.equal(replyGets, 0, 'Initial render should use preloaded replies');
  // Invoke the actual handler used after successful reply submission.
  item.onReplyCreated(
    new CustomEvent('reload', { detail: { resetForm: () => true } })
  );
  await until(() => replies.replies.length === 2);
  const toggle = item.shadowRoot.querySelector('.show-replies-button');
  toggle.click();
  await item.updateComplete;
  assert.equal(item.shadowRoot.querySelector('comment-replies'), null);
  toggle.click();
  await item.updateComplete;
  replies = item.shadowRoot.querySelector('comment-replies');
  await replies.updateComplete;
  await until(() => !replies.loading);
  assert.include(
    replies.replies.map((r) => r.metadata.name),
    'new-reply'
  );
  assert.equal(replyGets, 2, 'Reopening should fetch current replies');
});
