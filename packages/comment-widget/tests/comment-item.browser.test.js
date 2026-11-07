import { assert, test } from 'vitest';
import { mockApi } from './browser-helpers.js';
import '../src/comment-item.ts';

test('reply toggle exposes the form state when replies are inline', async () => {
  mockApi(() =>
    Response.json({
      items: [],
      page: 1,
      size: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    })
  );
  const element = document.createElement('comment-item');
  element.comment = {
    metadata: { name: 'inline-reply-toggle' },
    spec: {
      content: 'test',
      approved: true,
      owner: { kind: 'User', name: 'admin' },
    },
    owner: { displayName: 'Admin' },
    stats: { upvote: 0 },
    status: { visibleReplyCount: 0 },
  };
  document.body.append(element);
  await element.updateComplete;

  const button = element.shadowRoot.querySelector('.show-replies-button');
  const label = () => button.querySelector('.sr-only').textContent.trim();
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(label(), 'Add Reply');

  button.click();
  await element.updateComplete;
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(label(), 'Cancel reply');

  element.closeReplyForm();
  await element.updateComplete;
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(label(), 'Add Reply');
});
