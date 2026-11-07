import { assert, test, vi } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test.each(['success', 'out-of-range', 'error'])(
  'latest page selection survives a stale %s response',
  async (outcome) => {
    const pending = new Map();
    const list = (page) => ({
      page,
      size: 20,
      total: 60,
      totalPages: 3,
      hasNext: page < 3,
      hasPrevious: page > 1,
      items: [
        {
          metadata: { name: `page-${page}` },
          spec: {
            content: `page-${page}`,
            approved: true,
            owner: { kind: 'User', name: 'admin' },
          },
          owner: { displayName: 'Admin' },
          stats: { upvote: 0 },
        },
      ],
    });
    const response = (page) =>
      new Response(JSON.stringify(list(page)), {
        headers: { 'Content-Type': 'application/json' },
      });
    mockApi(async (input) => {
      const page = Number(
        new URL(String(input), location.href).searchParams.get('page')
      );
      if (page === 1) return response(page);
      return new Promise((resolve) =>
        pending.set(page, () =>
          resolve(
            page === 2 && outcome === 'error'
              ? new Response('{}', { status: 403 })
              : page === 2 && outcome === 'out-of-range'
                ? new Response(
                    JSON.stringify({ ...list(page), totalPages: 1 }),
                    { headers: { 'Content-Type': 'application/json' } }
                  )
                : response(page)
          )
        )
      );
    });
    await import('../src/comment-list.ts');
    const element = document.createElement('comment-list');
    document.body.append(element);
    await until(() => element.comments.items.length === 1);
    await element.updateComplete;
    const fetchComments = vi.spyOn(element, 'fetchComments');
    const scroll = vi
      .spyOn(element, 'scrollIntoView')
      .mockImplementation(() => {});
    const error = vi.fn();
    element.toastManager = { error };
    const pagination = element.shadowRoot.querySelector('comment-pagination');
    await pagination.updateComplete;
    const trigger = pagination.shadowRoot.querySelector('.pagination-trigger');
    const pages = pagination.shadowRoot.querySelectorAll(
      '.pagination-pages button'
    );
    trigger.click();
    pages[1].click();
    await until(() => pending.has(2));
    trigger.click();
    pages[2].click();
    await until(() => pending.has(3));
    pending.get(3)();
    await until(() => element.comments.items[0].metadata.name === 'page-3');
    pending.get(2)();
    await fetchComments.mock.results[0].value;
    await element.updateComplete;
    assert.equal(
      fetchComments.mock.calls.length,
      2,
      'Stale responses must not trigger pagination fallback'
    );
    assert.equal(
      scroll.mock.calls.length,
      1,
      'Only the latest request should scroll'
    );
    assert.equal(
      error.mock.calls.length,
      0,
      'Stale errors must not show a toast'
    );
    assert.equal(
      element.comments.page,
      3,
      'The latest selected page should remain visible'
    );
  }
);

test('pagination state is read from and written to the URL', async () => {
  const requests = [];
  const pageData = (page) => ({
    page,
    size: 20,
    total: 40,
    totalPages: 2,
    hasNext: page < 2,
    hasPrevious: page > 1,
    items: [
      {
        metadata: { name: `page-${page}` },
        spec: {
          content: `page-${page}`,
          approved: true,
          owner: { kind: 'User', name: 'admin' },
        },
        owner: { displayName: 'Admin' },
        stats: { upvote: 0 },
      },
    ],
  });
  mockApi((input) => {
    const page = Number(
      new URL(String(input), location.href).searchParams.get('page')
    );
    requests.push(page);
    return new Response(JSON.stringify(pageData(page)), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  history.replaceState(null, '', '?comment-page=2');
  await import('../src/comment-list.ts');
  const element = document.createElement('comment-list');
  element.scrollIntoView = () => {};
  document.body.append(element);
  await until(() => element.comments.items[0]?.metadata.name === 'page-2');
  assert.equal(requests[0], 2, 'A linked page must be requested initially');

  const pagination = element.shadowRoot.querySelector('comment-pagination');
  await pagination.updateComplete;
  pagination.shadowRoot.querySelector('.pagination-trigger').click();
  pagination.shadowRoot.querySelectorAll('.pagination-pages button')[0].click();
  await until(() => element.comments.items[0]?.metadata.name === 'page-1');
  assert.equal(
    new URL(location.href).searchParams.get('comment-page'),
    null,
    'Returning to the first page must remove the URL parameter'
  );
});

test('a late response after disconnect does not rewrite the URL', async () => {
  let resolvePage2;
  mockApi((input) => {
    const page = Number(
      new URL(String(input), location.href).searchParams.get('page')
    );
    if (page === 2) {
      return new Promise((resolve) => {
        resolvePage2 = () =>
          resolve(
            new Response(
              JSON.stringify({
                page: 2,
                size: 20,
                total: 60,
                totalPages: 3,
                hasNext: true,
                hasPrevious: true,
                items: [],
              }),
              { headers: { 'Content-Type': 'application/json' } }
            )
          );
      });
    }
    return new Response(
      JSON.stringify({
        page,
        size: 20,
        total: 60,
        totalPages: 3,
        hasNext: true,
        hasPrevious: false,
        items: [],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });
  await import('../src/comment-list.ts');
  const element = document.createElement('comment-list');
  element.scrollIntoView = () => {};
  document.body.append(element);
  await until(() => !element.loading);
  const pending = element.onPageChange({ detail: { page: 2 } });
  await until(() => resolvePage2);
  element.remove();
  resolvePage2();
  await pending;
  assert.equal(
    new URL(location.href).searchParams.get('comment-page'),
    null,
    'A disconnected list must not write its page back to the URL'
  );
});

test('a failed initial load does not show the empty state', async () => {
  mockApi(() => new Response('{}', { status: 500 }));
  await import('../src/comment-list.ts');
  const element = document.createElement('comment-list');
  element.toastManager = { error() {} };
  document.body.append(element);
  await until(() => element.loadFailed);
  await element.updateComplete;
  assert.equal(element.shadowRoot.querySelector('.comment-empty'), null);
});

test('a popstate request does not inherit the pending push intent', async () => {
  mockApi((input) => {
    const page = Number(
      new URL(String(input), location.href).searchParams.get('page')
    );
    return Response.json({
      page,
      size: 20,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrevious: page > 1,
      items: [],
    });
  });
  await import('../src/comment-list.ts');
  const element = document.createElement('comment-list');
  element.scrollIntoView = () => {};
  document.body.append(element);
  await until(() => !element.loading);

  // A page click is still in flight when the user goes Back to page 2; the
  // server has shrunk to one page, so the request falls back to page 1.
  element.comments.page = 4;
  element.pageChangeShouldPush = true;
  history.replaceState(null, '', '?comment-page=2');
  const push = vi.spyOn(history, 'pushState');
  element.onLocationChange();
  await until(() => element.comments.page === 1 && !element.loading);

  assert.equal(
    push.mock.calls.length,
    0,
    'A popstate-driven fetch must replace the current entry, not push'
  );
});

test('a reconnected list does not push a stale page intent', async () => {
  let page2Calls = 0;
  let resolveFirstPage2;
  const list = (page) => ({
    page,
    size: 20,
    total: 40,
    totalPages: 2,
    hasNext: page < 2,
    hasPrevious: page > 1,
    items: [],
  });
  mockApi((input) => {
    const page = Number(
      new URL(String(input), location.href).searchParams.get('page')
    );
    if (page === 2 && ++page2Calls === 1) {
      return new Promise((resolve) => {
        resolveFirstPage2 = () => resolve(Response.json(list(2)));
      });
    }
    return Response.json(list(page));
  });
  await import('../src/comment-list.ts');
  const element = document.createElement('comment-list');
  element.scrollIntoView = () => {};
  document.body.append(element);
  await until(() => !element.loading);

  const pending = element.onPageChange({ detail: { page: 2 } });
  await until(() => page2Calls === 1);
  const push = vi.spyOn(history, 'pushState');
  element.remove();
  document.body.append(element);
  await until(() => element.comments.page === 2 && !element.loading);

  assert.equal(
    push.mock.calls.length,
    0,
    'Reconnecting must not push a page intent left over from before disconnect'
  );
  resolveFirstPage2();
  await pending;
});
