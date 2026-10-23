import { assert, test, vi } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('deleted reply stays absent when an older load-more response arrives', async () => {
  const reply = (name) => ({
    metadata: { name },
    spec: {
      commentName: 'c1',
      content: name,
      approved: true,
      owner: { kind: 'User', name: 'admin' },
    },
    owner: { displayName: 'Admin' },
    stats: { upvote: 0 },
  });
  const r1 = reply('deleted-reply');
  const r2 = reply('remaining-reply');
  const list = (items, size = 2) => ({
    items,
    page: 1,
    size,
    total: items.length,
    totalPages: 1,
    hasNext: false,
  });
  const response = (data) =>
    new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  let releaseOld;
  let gets = 0;
  let deleted = false;
  mockApi(async (input, options) => {
    if (options?.method === 'DELETE') {
      deleted = true;
      return response({});
    }
    if (new URL(String(input), location.href).pathname.endsWith('/reply')) {
      if (++gets === 1)
        return new Promise((resolve) => {
          releaseOld = () => resolve(response(list([r1, r2])));
        });
      assert.isTrue(deleted);
      return response(list([r2]));
    }
    return response({});
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  await import('../src/comment-replies.ts');
  const el = document.createElement('comment-replies');
  el.configMapData = { basic: { withReplies: true, replySize: 2 } };
  el.comment = {
    ...reply('c1'),
    replies: { ...list([r1], 1), total: 2, hasNext: true },
  };
  document.body.append(el);
  await el.updateComplete;
  const pending = vi.spyOn(el, 'fetchReplies');
  el.shadowRoot.querySelector('.replies-next-button').click();
  await until(() => releaseOld);
  const item = el.shadowRoot.querySelector('reply-item');
  await item.updateComplete;
  const management = item.shadowRoot.querySelector('comment-management');
  management.canManage = true;
  await management.updateComplete;
  management.shadowRoot.querySelector('details').open = true;
  management.shadowRoot.querySelector('button:last-child').click();
  await until(() => gets === 2 && !el.loading);
  assert.deepEqual(
    el.replies.map((r) => r.metadata.name),
    ['remaining-reply']
  );
  releaseOld();
  await pending.mock.results[0].value;
  await el.updateComplete;
  assert.deepEqual(
    el.replies.map((r) => r.metadata.name),
    ['remaining-reply']
  );
});
