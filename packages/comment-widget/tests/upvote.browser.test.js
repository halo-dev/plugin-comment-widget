import { assert, expect, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

for (const tag of ['comment-item', 'reply-item']) {
  async function mountItem() {
    await import('../src/comment-item.ts');
    await import('../src/reply-item.ts');
    const resource = {
      metadata: { name: 'vote-race' },
      spec: {
        content: 'test',
        approved: true,
        owner: { kind: 'User', name: 'admin' },
      },
      owner: { displayName: 'Admin' },
      stats: { upvote: 0 },
    };
    const el = document.createElement(tag);
    el.comment = resource;
    el.reply = resource;
    document.body.append(el);
    await el.updateComplete;
    return el;
  }

  test(`${tag}: pending and completed upvotes cannot be submitted twice`, async () => {
    const releases = [];
    mockApi(
      () =>
        new Promise((resolve) =>
          releases.push(() => resolve(new Response('{}')))
        )
    );
    const el = await mountItem();
    const button = el.shadowRoot.querySelector('button[aria-label="Upvote"]');
    button.click();
    button.click();
    await until(() => releases.length > 0);
    releases.forEach((release) => {
      release();
    });
    await until(() => el.upvoteCount > 0);
    await el.updateComplete;
    assert.equal(releases.length, 1);
    assert.equal(el.upvoteCount, 1);
    assert.equal(button.textContent.trim(), '1');
    button.click();
    await el.handleUpvote();
    assert.equal(releases.length, 1);
  });

  test(`${tag}: failed upvotes can be retried`, async () => {
    let requests = 0;
    mockApi(() => {
      requests++;
      return Promise.resolve(
        new Response('{}', { status: requests === 1 ? 500 : 200 })
      );
    });
    const el = await mountItem();
    await expect(el.handleUpvote()).rejects.toThrow('500');
    assert.equal(el.upvoteCount, 0);
    assert.isFalse(el.upvoted);
    await el.handleUpvote();
    assert.equal(requests, 2);
    assert.equal(el.upvoteCount, 1);
    assert.isTrue(el.upvoted);
  });
}
