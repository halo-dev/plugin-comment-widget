import { assert, test, vi } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('Comment management regression checks', async () => {
  const comment = {
    metadata: { name: 'comment-1' },
    spec: {
      content: 'Comment',
      approved: true,
      hidden: false,
      owner: { kind: 'User', name: 'admin' },
    },
    owner: { displayName: 'Admin' },
    stats: { upvote: 0 },
    status: { visibleReplyCount: 1 },
  };
  const reply = {
    ...structuredClone(comment),
    metadata: { name: 'reply-1' },
    spec: { ...comment.spec, content: 'Reply', commentName: 'comment-1' },
  };
  let deletedReply = false;
  let deletedComment = false;
  let lastPage = false;
  let confirmation = '';
  let pagedReplies;
  const requests = [];
  const list = (items, page = 1, total = items.length, size = 20) => ({
    items,
    page,
    size,
    total,
    totalPages: Math.ceil(total / size),
    first: page === 1,
    last: page >= Math.ceil(total / size),
    hasNext: page < Math.ceil(total / size),
    hasPrevious: page > 1,
  });
  vi.spyOn(window, 'confirm').mockImplementation((message) => {
    confirmation = message;
    return true;
  });
  mockApi(async (input, options = {}) => {
    const url = new URL(String(input), location.href);
    requests.push(url);
    let data = {};
    if (options.method === 'DELETE') {
      if (url.pathname.includes('/replies/')) deletedReply = true;
      else deletedComment = true;
    } else if (options.method === 'PATCH') {
      const target = url.pathname.includes('/replies/')
        ? (pagedReplies?.find(
            (item) => item.metadata.name === url.pathname.split('/').at(-1)
          ) ?? reply)
        : comment;
      for (const patch of JSON.parse(options.body))
        target.spec[patch.path.split('/').at(-1)] = patch.value;
    } else if (url.pathname.endsWith('/globalinfo'))
      data = { allowAnonymousComments: true };
    else if (url.pathname.endsWith('/config'))
      data = { basic: { withReplies: true }, avatar: { enable: false } };
    else if (url.pathname.endsWith('/permissions'))
      data = { uiPermissions: ['system:comments:manage'] };
    else if (url.pathname.endsWith('/users/-'))
      data = { user: { metadata: { name: 'admin' }, spec: {} } };
    else if (url.pathname === '/apis/api.console.halo.run/v1alpha1/replies') {
      const selectors = url.searchParams.getAll('fieldSelector');
      if (
        ![
          'spec.approved=true',
          'spec.hidden=false',
          '!metadata.deletionTimestamp',
        ].every((s) => selectors.includes(s))
      )
        throw new Error('Missing visible reply filters');
      data = {
        total: Number(
          !deletedReply && reply.spec.approved && !reply.spec.hidden
        ),
      };
    } else if (url.pathname.endsWith('/reply')) {
      const page = Number(url.searchParams.get('page'));
      const size = Number(url.searchParams.get('size'));
      const rows = pagedReplies ?? (deletedReply ? [] : [reply]);
      data = list(
        rows.slice((page - 1) * size, page * size),
        page,
        rows.length,
        size
      );
    } else if (url.pathname.endsWith('/comments')) {
      const page = Number(url.searchParams.get('page'));
      // Keep status stale, as when ReplyEventReconciler has not run yet.
      data = lastPage
        ? list(
            deletedComment
              ? page === 2
                ? []
                : [{ ...comment, metadata: { name: 'previous-comment' } }]
              : [comment],
            page,
            deletedComment ? 20 : 21
          )
        : list([comment]);
    }
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  const actionButton = (management, text) =>
    [...management.shadowRoot.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === text
    );
  await import('../src/index.ts');
  const widget = document.createElement('comment-widget');
  document.body.append(widget);
  await until(
    () =>
      widget.shadowRoot?.querySelector('comment-list')?.comments.items.length
  );
  const comments = widget.shadowRoot.querySelector('comment-list');
  const item = comments.shadowRoot.querySelector('comment-item');
  await until(() =>
    item.shadowRoot
      ?.querySelector('comment-replies')
      ?.shadowRoot?.querySelector('reply-item')
  );
  const replies = item.shadowRoot.querySelector('comment-replies');
  const management = replies.shadowRoot
    .querySelector('reply-item')
    .shadowRoot.querySelector('comment-management');
  await management.updateComplete;
  management.shadowRoot.querySelector('summary').click();
  actionButton(management, 'Hide').click();
  await until(() => item.comment.status.visibleReplyCount === 0);
  assert(
    comment.status.visibleReplyCount === 1,
    'Fixture must retain stale server status'
  );
  assert(reply.spec.hidden, 'Reply should be hidden');

  management.shadowRoot.querySelector('summary').click();
  const deleteButton = actionButton(management, 'Delete');
  deleteButton.focus();
  deleteButton.click();
  await until(() => !management.isConnected);
  assert(
    confirmation === 'Delete this reply? This cannot be undone.',
    'Reply deletion scope is incorrect'
  );
  assert(
    widget.shadowRoot.activeElement === comments,
    'Deleted reply must hand focus to the list'
  );

  pagedReplies = Array.from({ length: 31 }, (_, index) => ({
    ...structuredClone(reply),
    metadata: { name: `paged-reply-${index}` },
    spec: { ...reply.spec, approved: true, hidden: false },
  }));
  await replies.fetchReplies();
  await replies.fetchNext();
  await replies.updateComplete;
  const pagedItem = replies.shadowRoot.querySelectorAll('reply-item')[19];
  await pagedItem.updateComplete;
  const pagedManagement =
    pagedItem.shadowRoot.querySelector('comment-management');
  await pagedManagement.updateComplete;
  pagedManagement.shadowRoot.querySelector('summary').click();
  const unapprove = actionButton(pagedManagement, 'Cancel approval');
  unapprove.focus();
  unapprove.click();
  await until(() => replies.replies[19]?.spec.approved === false);
  await replies.updateComplete;
  assert(
    replies.replies.length === 20,
    'Management must preserve the loaded reply range'
  );
  assert(
    pagedManagement.isConnected && pagedManagement.matches(':focus-within'),
    'Management must retain keyboard focus'
  );
  await replies.fetchNext();
  assert(
    replies.replies.length === 30,
    'Load more must continue after the refreshed range'
  );
  assert(
    new Set(replies.replies.map((item) => item.metadata.name)).size === 30,
    'Load more must not duplicate replies'
  );

  lastPage = true;
  await comments.fetchComments({ page: 2 });
  await comments.updateComplete;
  const rootManagement = comments.shadowRoot
    .querySelector('comment-item')
    .shadowRoot.querySelector('comment-management');
  await rootManagement.updateComplete;
  rootManagement.shadowRoot.querySelector('summary').click();
  const rootDelete = actionButton(rootManagement, 'Delete');
  rootDelete.focus();
  rootDelete.click();
  await until(() => deletedComment && comments.comments.page === 1);
  assert(
    comments.comments.items.length === 1,
    'Deletion must return to a populated valid page'
  );
  await comments.updateComplete;
  assert(!rootManagement.isConnected, 'Deleted comment must be removed');
  assert(
    widget.shadowRoot.activeElement === comments,
    'Pagination fallback must retain list focus'
  );
  assert(
    confirmation ===
      'Delete this comment and its replies? This cannot be undone.',
    'Comment deletion scope is incorrect'
  );
});
