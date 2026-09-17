import { expect, test, vi } from 'vitest';
import '../src/comment-form.ts';
import '../src/reply-form.ts';
import { mockApi, until } from './browser-helpers.js';

test.each(['disabled', 'denied', 'invalid JSON', 'null'])(
  'anonymous form renders when account storage is %s',
  async (storage) => {
    if (storage === 'disabled') {
      vi.stubGlobal('localStorage', null);
    } else if (storage === 'denied') {
      const getItem = Storage.prototype.getItem;
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (key) {
        if (key === 'halo-comment-custom-account') {
          throw new DOMException('Access denied', 'SecurityError');
        }
        return getItem.call(this, key);
      });
    } else {
      localStorage.setItem(
        'halo-comment-custom-account',
        storage === 'null' ? 'null' : '{invalid'
      );
    }
    try {
      const form = document.createElement('base-form');
      form.allowAnonymousComments = true;
      document.body.append(form);
      await form.updateComplete;
      expect(form.shadowRoot.querySelector('input[name=email]').value).toBe('');
      expect(
        form.shadowRoot.querySelector('button[type=submit]')
      ).not.toBeNull();
      await until(() => form.editorRef.value?.editor);
      form.editorRef.value.editor.commands.setContent('<p>Still editable</p>');
      expect(form.editorRef.value.editor.getText()).toBe('Still editable');
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    }
  }
);

test.each([
  ['comment-form', false],
  ['reply-form', false],
  ['comment-form', true],
  ['reply-form', true],
])(
  '%s submits when localStorage is full (unsaved edit: %s)',
  async (tag, editAfterQuota) => {
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
    const content = editAfterQuota
      ? '<p>My comment with more text after quota is exhausted</p>'
      : '<p>My comment</p>';
    if (editAfterQuota) {
      form.editorRef.value.editor.commands.setContent(content);
      expect(
        JSON.parse(localStorage.getItem(form.getDraftSnapshot().key)).content
      ).toBe('<p>My comment</p>');
    }
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
    expect(JSON.parse(post.mock.calls[0][1]).content).toBe(content);
    expect(form.editorRef.value.editor.getText()).toBe('');
    expect(localStorage.getItem(form.getDraftSnapshot().key)).toBeNull();
    await until(() => !form.uploading);
    await form.submitData();
    expect(post).toHaveBeenCalledTimes(1);
  }
);
