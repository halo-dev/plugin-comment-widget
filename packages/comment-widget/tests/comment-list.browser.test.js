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
