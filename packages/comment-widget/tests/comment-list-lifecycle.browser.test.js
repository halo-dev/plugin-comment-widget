import { expect, test } from 'vitest';
import '../src/comment-list.ts';
import '../src/comment-form.ts';
import { UploadSession } from '../src/utils/upload-session.ts';
import { mockApi, until } from './browser-helpers.js';

test('submitting a comment only reloads the mounted article list', async () => {
  const requests = [];
  mockApi(async (input, options = {}) => {
    const url = new URL(String(input), location.href);
    if (options.method === 'POST') {
      return Response.json({ spec: { approved: true } });
    }
    requests.push(url.searchParams.get('name'));
    return Response.json({
      items: [],
      page: 1,
      size: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    });
  });
  for (const name of ['article-a', 'article-b', 'article-c', 'article-d']) {
    const list = document.createElement('comment-list');
    list.name = name;
    document.body.append(list);
    await until(() => !list.loading);
    if (name !== 'article-d') list.remove();
    else {
      list.remove();
      document.body.append(list);
      await until(() => !list.loading);
    }
  }
  const form = document.createElement('comment-form');
  form.currentUser = { metadata: { name: 'admin' }, spec: {} };
  form.name = 'article-d';
  document.body.append(form);
  await until(() => form.baseFormRef.value?.editorRef.value?.editor);
  form.baseFormRef.value.editorRef.value.editor.commands.setContent(
    '<p>Hello</p>'
  );
  requests.length = 0;
  await form.onSubmit(
    new CustomEvent('submit', {
      detail: {
        content: '<p>Hello</p>',
        uploadIds: [],
        uploadSession: new UploadSession(),
      },
    })
  );
  await until(() => requests.includes('article-d'));
  expect(requests).toEqual(['article-d']);
});
