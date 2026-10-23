import { expect, test, vi } from 'vitest';
import '../src/comment-form.ts';
import '../src/reply-form.ts';
import { mockApi, until } from './browser-helpers.js';

function denyStorage() {
  const deny = () => {
    throw new DOMException('IndexedDB access denied', 'SecurityError');
  };
  vi.spyOn(IDBFactory.prototype, 'open').mockImplementation(deny);
  vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(deny);
}

async function mount(tag) {
  const owner = document.createElement(tag);
  owner.currentUser = { metadata: { name: 'admin' }, spec: {} };
  owner.comment = { metadata: { name: 'storage-test' } };
  owner.toastManager = { error: vi.fn(), success: vi.fn() };
  document.body.append(owner);
  await until(() => owner.baseFormRef.value?.editorRef.value?.editor);
  return owner;
}

function mockSubmission() {
  const post = vi.fn();
  mockApi(async (input, options) => {
    if (options?.method === 'POST') post(String(input), options.body);
    return new Response(JSON.stringify({ spec: { approved: true } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  return post;
}

test.each(['comment-form', 'reply-form'])(
  '%s submits fresh text when IndexedDB is unavailable',
  async (tag) => {
    denyStorage();
    const post = mockSubmission();
    const owner = await mount(tag);
    const form = owner.baseFormRef.value;
    form.editorRef.value.editor.commands.setContent(
      '<p>Text without images</p>'
    );
    await form.submitData();
    expect(post).toHaveBeenCalledTimes(1);
    expect(JSON.parse(post.mock.calls[0][1]).content).toBe(
      '<p>Text without images</p>'
    );
    expect(owner.toastManager.error).not.toHaveBeenCalled();
    expect(form.editorRef.value.editor.getText()).toBe('');
  }
);

test('an existing draft cannot bypass an unreadable pending upload ticket', async () => {
  const { writeUploadDraft } = await import('../src/utils/upload-draft.ts');
  const original = await mount('comment-form');
  const form = original.baseFormRef.value;
  form.editorRef.value.editor.commands.setContent('<p>Existing draft</p>');
  const { key, revision } = form.getDraftSnapshot();
  await writeUploadDraft(
    key,
    revision,
    {
      revision,
      session: {
        token: 'owner',
        pending: {
          id: 'pending-ticket',
          token: 'owner',
          fingerprint: 'old body',
        },
      },
    },
    true,
    {}
  );
  original.remove();
  denyStorage();
  const post = mockSubmission();
  const restored = await mount('comment-form');
  await restored.baseFormRef.value.submitData();
  expect(post).not.toHaveBeenCalled();
  expect(restored.toastManager.error).toHaveBeenCalledWith(
    'IndexedDB access denied'
  );
  expect(restored.baseFormRef.value.editorRef.value.editor.getText()).toBe(
    'Existing draft'
  );
});

test('storage failure after a successful read still prevents submission', async () => {
  const post = mockSubmission();
  const owner = await mount('comment-form');
  denyStorage();
  const form = owner.baseFormRef.value;
  form.editorRef.value.editor.commands.setContent(
    '<p>Keep recovery protection</p>'
  );
  await form.submitData();
  expect(post).not.toHaveBeenCalled();
  expect(owner.toastManager.error).toHaveBeenCalledWith(
    'IndexedDB access denied'
  );
});

test('fresh image submissions still require a persisted ticket', async () => {
  const { renderImage } = await import('../src/extension/uploaded-images.ts');
  denyStorage();
  const requests = [];
  mockApi(async (input) => {
    const path = new URL(String(input), location.href).pathname;
    requests.push(path);
    const result = path.endsWith('/upload')
      ? [
          {
            uploadId: 'image',
            url: '/image.png',
            expiresAt: '2099-01-01T00:00:00Z',
          },
        ]
      : { id: 'ticket' };
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
  const owner = await mount('comment-form');
  const form = owner.baseFormRef.value;
  renderImage({
    editor: form.editorRef.value.editor,
    file: new File(['image'], 'image.png', { type: 'image/png' }),
  });
  await form.submitData();
  expect(requests).toEqual([
    '/apis/api.commentwidget.halo.run/v1alpha1/upload',
    '/apis/api.commentwidget.halo.run/v1alpha1/submissions',
  ]);
  expect(owner.toastManager.error).toHaveBeenCalledWith(
    'IndexedDB access denied'
  );
  expect(form.editorRef.value.editor.getHTML()).toContain('/image.png');
});
