import { assert, test } from 'vitest';
import '../src/reply-item.ts';

test('quote badge includes its purpose in the accessible name', async () => {
  const quote = {
    metadata: { name: 'reply-quoted' },
    spec: {
      content: 'quoted',
      approved: true,
      owner: { kind: 'User', name: 'alice' },
    },
    owner: { displayName: 'Alice' },
    stats: { upvote: 0 },
  };
  const element = document.createElement('reply-item');
  element.comment = {
    metadata: { name: 'comment-1' },
    spec: {
      content: 'comment',
      approved: true,
      owner: { kind: 'User', name: 'admin' },
    },
    owner: { displayName: 'Admin' },
    stats: { upvote: 0 },
  };
  element.reply = {
    metadata: { name: 'reply-1' },
    spec: {
      content: 'replying',
      approved: true,
      owner: { kind: 'User', name: 'bob' },
      quoteReply: 'reply-quoted',
    },
    owner: { displayName: 'Bob' },
    stats: { upvote: 0 },
  };
  element.replies = [quote];
  document.body.append(element);
  await element.updateComplete;

  const badge = element.shadowRoot.querySelector('.quote-badge');
  assert.ok(badge);
  assert.equal(
    badge.textContent.replace(/\s+/g, ' ').trim(),
    'In reply to Alice'
  );
});
