import { expect, test, vi } from 'vitest';
import '../src/comment-form.ts';
import '../src/reply-form.ts';
import { mockApi, until } from './browser-helpers.js';

test.each(['comment-form', 'reply-form'])(
  '%s submits when localStorage is full',
  async (tag) => {
    const post = vi.fn();
    mockApi(async (input, options) => {
      if (options?.method === 'POST') post(String(input), options.body);
      return new Response(JSON.stringify({ spec: { approved: true } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const owner = document.createElement(tag);
    owner.currentUser = { metadata: { name: 'admin' }, spec: {} };
    owner.comment = { metadata: { name: 'storage-test' } };
    document.body.append(owner);
    await until(() => owner.baseFormRef.value?.editorRef.value?.editor);
    const form = owner.baseFormRef.value;
    form.editorRef.value.editor.commands.setContent('<p>My comment</p>');

    // Exhaust Chromium's real quota without mocking Storage.
    let index = 0;
    for (let size = 1024 * 1024; size >= 1; size = Math.floor(size / 2)) {
      for (;;) {
        try {
          localStorage.setItem(`quota-${index}`, 'x'.repeat(size));
          index++;
        } catch (error) {
          expect(error.name).toBe('QuotaExceededError');
          break;
        }
      }
    }
    expect(() =>
      localStorage.setItem('halo-comment-custom-account', '{}')
    ).toThrow();
    expect(() =>
      form.onSubmit({
        preventDefault() {},
        target: form.shadowRoot.querySelector('form'),
      })
    ).not.toThrow();
    await until(() => post.mock.calls.length === 1 && !owner.submitting);
    const endpoint = '/apis/api.halo.run/v1alpha1/comments';
    expect(post.mock.calls[0][0]).toBe(
      tag === 'comment-form' ? endpoint : `${endpoint}/storage-test/reply`
    );
    expect(JSON.parse(post.mock.calls[0][1]).content).toBe('<p>My comment</p>');
    expect(form.editorRef.value.editor.getText()).toBe('');
  }
);
