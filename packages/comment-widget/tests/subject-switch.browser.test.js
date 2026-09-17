import { expect, test } from 'vitest';
import { mockApi, until } from './browser-helpers.js';

test('switching articles updates submissions and lists while preserving separate drafts', async () => {
  const posts = [];
  const queries = [];
  mockApi((input, options = {}) => {
    const url = new URL(String(input), location.href);
    const path = url.pathname;
    let data = {};
    if (options.method === 'POST' && path.endsWith('/comments')) {
      posts.push(JSON.parse(options.body));
      data = { spec: { approved: true } };
    } else if (path.endsWith('/globalinfo')) {
      data = { allowAnonymousComments: true };
    } else if (path.endsWith('/config')) {
      data = {
        basic: {},
        avatar: { enable: false },
        editor: { enableEmoji: false },
      };
    } else if (path.endsWith('/users/-')) {
      data = { user: { metadata: { name: 'review-user' }, spec: {} } };
    } else if (path.endsWith('/comments')) {
      queries.push(url.searchParams.get('name'));
      data = {
        items: [],
        page: 1,
        size: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
      };
    }
    return Promise.resolve(Response.json(data));
  });
  await import('../src/index.ts');
  const widget = document.createElement('comment-widget');
  widget.group = 'content.halo.run';
  widget.kind = 'Post';
  widget.version = 'v1alpha1';
  widget.name = 'article-A';
  document.body.append(widget);
  const baseForm = () =>
    widget.shadowRoot?.querySelector('comment-form')?.baseFormRef.value;
  const ready = () => until(() => baseForm()?.editorRef.value?.editor);
  await ready();
  const original = baseForm();
  original.editorRef.value.editor.commands.setContent('<p>Draft for A</p>');

  widget.setAttribute('name', 'article-B');
  await widget.updateComplete;
  await ready();
  const current = baseForm();
  expect(current.editorRef.value.editor.getText()).toBe('');
  await until(() => queries.includes('article-B'));
  current.editorRef.value.editor.commands.setContent('<p>Comment for B</p>');
  await current.updateComplete;
  current.shadowRoot.querySelector('form').requestSubmit();
  await until(() => posts.length === 1 && !current.uploading);
  expect(posts[0].subjectRef).toEqual({
    group: 'content.halo.run',
    kind: 'Post',
    version: 'v1alpha1',
    name: 'article-B',
  });
  expect(posts[0].content).toBe('<p>Comment for B</p>');

  widget.name = 'article-A';
  await widget.updateComplete;
  await ready();
  expect(baseForm().editorRef.value.editor.getText()).toBe('Draft for A');
  queries.length = 0;
  window.dispatchEvent(new CustomEvent('halo:comment:created'));
  await until(() => queries.length > 0);
  expect(queries).toEqual(['article-A']);
});
