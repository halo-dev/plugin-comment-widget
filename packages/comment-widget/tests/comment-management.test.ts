import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  fetchManagementPermission,
  manageComment,
} from '../src/utils/comment-management.ts';

test('management permissions fail closed and mutations follow Halo contracts', async (t) => {
  let permissions = ['system:comments:view'];
  let status = 200;
  const requests: {
    method?: string;
    url?: string;
    type?: string;
    body: unknown;
  }[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({
      method: req.method,
      url: req.url,
      type: req.headers['content-type'],
      body: body ? JSON.parse(body) : undefined,
    });
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ uiPermissions: permissions }));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  assert.equal(await fetchManagementPermission(baseUrl), false);
  permissions = ['system:comments:manage'];
  assert.equal(await fetchManagementPermission(baseUrl), true);
  permissions = ['*'];
  assert.equal(await fetchManagementPermission(baseUrl), true);
  status = 403;
  assert.equal(await fetchManagementPermission(baseUrl), false);
  status = 200;
  for (const resource of ['comments', 'replies'] as const) {
    for (const action of [
      'approve',
      'unapprove',
      'hide',
      'unhide',
      'delete',
    ] as const) {
      await manageComment(baseUrl, resource, 'name/with space', action);
      const request = requests.at(-1);
      assert.ok(request);
      assert.equal(
        request.url,
        `/apis/content.halo.run/v1alpha1/${resource}/name%2Fwith%20space`
      );
      assert.equal(request.method, action === 'delete' ? 'DELETE' : 'PATCH');
      if (action === 'delete') {
        assert.equal(request.body, undefined);
      } else {
        assert.equal(request.type, 'application/json-patch+json');
        if (action === 'approve' || action === 'unapprove') {
          const body = request.body as {
            op: string;
            path: string;
            value: unknown;
          }[];
          assert.deepEqual(body[0], {
            op: 'add',
            path: '/spec/approved',
            value: action === 'approve',
          });
          assert.equal(body[1].path, '/spec/approvedTime');
          if (action === 'approve')
            assert.ok(Number.isFinite(Date.parse(body[1].value as string)));
          else assert.equal(body[1].value, '');
        } else {
          assert.deepEqual(request.body, [
            { op: 'add', path: '/spec/hidden', value: action === 'hide' },
          ]);
        }
      }
    }
  }
  for (const action of ['pin', 'unpin'] as const) {
    await manageComment(baseUrl, 'comments', 'name', action);
    assert.deepEqual(requests.at(-1), {
      method: 'PATCH',
      url: '/apis/content.halo.run/v1alpha1/comments/name',
      type: 'application/json-patch+json',
      body: [{ op: 'add', path: '/spec/top', value: action === 'pin' }],
    });
  }
  status = 403;
  const count = requests.length;
  await assert.rejects(manageComment(baseUrl, 'comments', 'name', 'delete'));
  assert.equal(requests.length, count + 1);
});
