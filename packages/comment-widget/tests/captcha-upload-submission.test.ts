import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'vitest';
import { getAltchaHeader, getCaptchaCodeHeader } from '../src/utils/captcha.ts';
import { UploadSession } from '../src/utils/upload-session.ts';

for (const provider of [
  {
    name: 'Turnstile',
    header: 'x-turnstile-token',
    headers: getCaptchaCodeHeader('', 'verified-token'),
  },
  {
    name: 'ALTCHA',
    header: 'x-altcha-payload',
    headers: getAltchaHeader('verified-token'),
  },
]) {
  for (const withImages of [false, true]) {
    test(`sends ${provider.name} token through upload submission (images: ${withImages})`, async () => {
      const requests: {
        token: string | undefined;
        ticket: string | undefined;
      }[] = [];
      const server = createServer((request, response) => {
        request.resume();
        response.setHeader('Content-Type', 'application/json');
        if (request.url?.endsWith('/submissions')) {
          response.end(
            JSON.stringify({
              id: 'ticket',
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            })
          );
          return;
        }
        requests.push({
          token: request.headers[provider.header] as string | undefined,
          ticket: request.headers['x-comment-submission'] as string | undefined,
        });
        response.end(JSON.stringify({ spec: { approved: true } }));
      });
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve)
      );
      const address = server.address() as { port: number };
      const base = `http://127.0.0.1:${address.port}`;
      try {
        const ids = withImages ? ['upload'] : [];
        await new UploadSession().submit(
          `${base}/comments`,
          { content: 'test' },
          ids,
          provider.headers,
          base
        );
        assert.equal(requests.length, 1);
        assert.equal(requests[0].token, 'verified-token');
        assert.equal(Boolean(requests[0].ticket), withImages);
      } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    });
  }
}
