import assert from 'node:assert/strict';
import { createServer, type ServerResponse } from 'node:http';
import { test } from 'vitest';
import { UploadSession } from '../src/utils/upload-session.ts';

async function withServer(
  fn: (
    base: string,
    state: { posts: string[]; status: string; tickets: number }
  ) => Promise<void>
) {
  const state = { posts: [] as string[], status: 'UNKNOWN', tickets: 0 };
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'DELETE') {
      state.status = 'FAILED';
      res.writeHead(204);
      return res.end();
    }
    if (req.method === 'GET') {
      return respondWithStatus(res, state.status);
    }
    if (req.url?.endsWith('/submissions')) {
      state.tickets++;
      req.resume();
      return res.end(
        JSON.stringify({
          id: crypto.randomUUID(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        })
      );
    }
    state.posts.push(req.headers['x-comment-submission'] as string);
    req.resume();
    req.on('end', () => {
      res.writeHead(500);
      res.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  try {
    await fn(`http://127.0.0.1:${address.port}`, state);
  } finally {
    await closeServer(server);
  }
}

test('unknown submission cannot be sent to Halo twice', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base),
      /being confirmed/
    );
    assert.equal(state.posts.length, 1);
  }));
test('confirmed successful submission recovers without another POST', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'BOUND';
    assert.equal(
      await session.submit(base, { content: 'one' }, ['upload'], {}, base),
      undefined
    );
    assert.equal(state.posts.length, 1);
  }));
test('known failed submission starts a new attempt', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'FAILED';
    await assert.rejects(
      session.submit(base, { content: 'two' }, ['upload'], {}, base)
    );
    assert.equal(state.posts.length, 2);
    assert.notEqual(state.posts[0], state.posts[1]);
  }));
test('removing all images does not bypass uncertainty protection', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    await assert.rejects(
      session.submit(base, { content: 'two' }, [], {}, base),
      /being confirmed/
    );
    assert.equal(state.posts.length, 1);
  }));

test('purged ticket never causes a second comment POST', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'MISSING';
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base),
      /has expired/
    );
    assert.equal(state.posts.length, 1);
  }));
test('unclaimed server ticket is reused after an uncertain response', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'ISSUED';
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    assert.equal(state.posts.length, 2);
    assert.equal(state.posts[0], state.posts[1]);
  }));

function respondWithStatus(response: ServerResponse, status: string) {
  if (status === 'MISSING') {
    response.statusCode = 404;
  }
  response.end(JSON.stringify({ state: status }));
}

function closeServer(server: ReturnType<typeof createServer>) {
  return new Promise<void>((resolve) => server.close(() => resolve()));
}

test('confirmed submission with changed content is not reported as success', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'BOUND';
    await assert.rejects(
      session.submit(base, { content: 'edited' }, ['upload'], {}, base),
      /Save your changes/
    );
    assert.equal(state.posts.length, 1);
  }));

test('issued ticket is cancelled before allowing changed content', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'ISSUED';
    await assert.rejects(
      session.submit(base, { content: 'edited' }, ['upload'], {}, base),
      /cancelled/
    );
    assert.equal(state.posts.length, 1);
    assert.equal(session.snapshot().pending, undefined);
    await assert.rejects(
      session.submit(base, { content: 'edited' }, ['upload'], {}, base)
    );
    assert.equal(state.tickets, 2);
  }));

test('ordinary submission does not acquire or attach an upload ticket', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'text' }, [], {}, base)
    );
    assert.equal(state.posts.length, 1);
    assert.equal(state.posts[0], undefined);
    assert.equal(state.tickets, 0);
  }));

test('confirmed old submission releases its ticket without discarding changed content', () =>
  withServer(async (base, state) => {
    const session = new UploadSession();
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    state.status = 'BOUND';
    await assert.rejects(
      session.submit(base, { content: 'new draft' }, [], {}, base),
      /Save your changes/
    );
    assert.equal(session.snapshot().pending, undefined);
    assert.equal(state.posts.length, 1);
    await assert.rejects(
      session.submit(base, { content: 'new draft' }, [], {}, base)
    );
    assert.equal(state.posts.length, 2);
  }));

test('a failed ticket checkpoint prevents POST and reuses the ticket on retry', () =>
  withServer(async (base, state) => {
    let fail = true;
    const session = new UploadSession(undefined, async () => {
      if (fail) throw new Error('storage unavailable');
    });
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base),
      /storage unavailable/
    );
    assert.equal(state.posts.length, 0);
    fail = false;
    state.status = 'ISSUED';
    await assert.rejects(
      session.submit(base, { content: 'one' }, ['upload'], {}, base)
    );
    assert.equal(state.posts.length, 1);
    assert.equal(state.tickets, 1);
  }));
