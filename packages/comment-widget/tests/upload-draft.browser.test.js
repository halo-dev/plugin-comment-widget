import { expect, test, vi } from 'vitest';
import '../src/base-form.ts';
import {
  renderImage,
  uploadEditorFiles,
  uploadedIds,
  uploadSession,
} from '../src/extension/uploaded-images.ts';

async function mount() {
  const form = document.createElement('base-form');
  form.name = 'cw205-probe';
  form.configMapData = {
    basic: {},
    editor: { enableUpload: true, upload: { allowAnonymous: true } },
    security: { captcha: { type: 'IMAGE' } },
  };
  document.body.append(form);
  await vi.waitFor(() => expect(form.editorRef.value?.editor).toBeTruthy(), {
    timeout: 5000,
  });
  return form;
}

test('local image survives draft remount', async () => {
  const form = await mount();
  renderImage({
    editor: form.editorRef.value.editor,
    file: new File(['image'], 'x.png', { type: 'image/png' }),
  });
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(form.editorRef.value.editor.getHTML()).toContain('<img');
  expect(form.getDraftSnapshot().content).not.toContain('blob:');
  expect(event.defaultPrevented).toBe(true);
  form.remove();
  const restored = await mount();
  expect(restored.editorRef.value.editor.getHTML()).toContain('<img');
  const image = restored.editorRef.value.editor.getJSON().content[0].content[0];
  expect(await image.attrs.file.text()).toBe('image');
});

test('uploaded draft restores its trusted upload identity', async () => {
  const form = await mount();
  const editor = form.editorRef.value.editor;
  editor.commands.setContent('<p>draft text</p>');
  renderImage({
    editor,
    file: new File(['image'], 'x.png', { type: 'image/png' }),
  });
  vi.spyOn(window, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify([
        {
          uploadId: 'managed-image',
          url: '/uploaded.png',
          expiresAt: '2099-01-01T00:00:00Z',
        },
      ]),
      { headers: { 'Content-Type': 'application/json' } }
    )
  );
  expect(await uploadEditorFiles(editor, '')).toBe(true);
  const previousToken = uploadSession(editor).token;
  form.remove();
  const restored = await mount();
  const restoredEditor = restored.editorRef.value.editor;
  expect(restoredEditor.getHTML()).toContain('/uploaded.png');
  expect(uploadedIds(restoredEditor)).toEqual(['managed-image']);
  expect(uploadSession(restoredEditor).token).toBe(previousToken);
});

test('English locale receives a localized upload error', async () => {
  const { uploadFiles } = await import('../src/utils/upload-api.ts');
  document.documentElement.lang = 'en';
  vi.spyOn(window, 'fetch').mockRejectedValue(new TypeError('network offline'));
  await expect(
    uploadFiles(
      [new File(['x'], 'x.png', { type: 'image/png' })],
      { token: 'a'.repeat(64) },
      ''
    )
  ).rejects.toThrow('Upload failed');
});

test('restored pending submission checks status instead of posting twice', async () => {
  let posts = 0;
  let status = 'UNKNOWN';
  vi.spyOn(window, 'fetch').mockImplementation(async (input) => {
    const path = new URL(String(input), location.href).pathname;
    const headers = { 'Content-Type': 'application/json' };
    if (path.endsWith('/upload'))
      return new Response(
        JSON.stringify([{ uploadId: 'one', url: '/one.png', expiresAt: '' }]),
        { headers }
      );
    if (path.endsWith('/submissions'))
      return new Response(JSON.stringify({ id: 'ticket' }), { headers });
    if (path.endsWith('/submissions/ticket'))
      return new Response(JSON.stringify({ state: status }), { headers });
    posts++;
    return new Response('{}', { status: 500, headers });
  });
  const original = await mount();
  const editor = original.editorRef.value.editor;
  renderImage({
    editor,
    file: new File(['x'], 'x.png', { type: 'image/png' }),
  });
  await uploadEditorFiles(editor, '');
  const body = { content: editor.getHTML() };
  const url = '/apis/api.halo.run/v1alpha1/comments';
  await expect(
    uploadSession(editor).submit(url, body, uploadedIds(editor), {}, '')
  ).rejects.toThrow();
  original.remove();
  const restored = await mount();
  const next = restored.editorRef.value.editor;
  await expect(
    uploadSession(next).submit(url, body, uploadedIds(next), {}, '')
  ).rejects.toThrow('being confirmed');
  status = 'BOUND';
  await expect(
    uploadSession(next).submit(url, body, uploadedIds(next), {}, '')
  ).resolves.toBeUndefined();
  expect(posts).toBe(1);
});

test('old success preserves a newer image with the same sanitized HTML', async () => {
  const original = await mount();
  renderImage({
    editor: original.editorRef.value.editor,
    file: new File(['old'], 'old.png', { type: 'image/png' }),
  });
  const submitted = original.getDraftSnapshot();
  original.remove();
  const active = await mount();
  active.editorRef.value.editor.commands.clearContent();
  renderImage({
    editor: active.editorRef.value.editor,
    file: new File(['new'], 'new.png', { type: 'image/png' }),
  });
  expect(active.getDraftSnapshot().content).toBe(submitted.content);
  expect(original.resetForm(submitted)).toBe(false);
  active.remove();
  const restored = await mount();
  expect(
    await restored.editorRef.value.editor
      .getJSON()
      .content[0].content[0].attrs.file.text()
  ).toBe('new');
});

test('successful reset removes persisted files and permits a fresh draft', async () => {
  const { readUploadDraft } = await import('../src/utils/upload-draft.ts');
  const form = await mount();
  renderImage({
    editor: form.editorRef.value.editor,
    file: new File(['old'], 'old.png', { type: 'image/png' }),
  });
  const submitted = form.getDraftSnapshot();
  expect(await readUploadDraft(submitted.key, submitted.revision)).toBeTruthy();
  expect(form.resetForm(submitted)).toBe(true);
  expect(
    await readUploadDraft(submitted.key, submitted.revision)
  ).toBeUndefined();
  renderImage({
    editor: form.editorRef.value.editor,
    file: new File(['new'], 'new.png', { type: 'image/png' }),
  });
  form.remove();
  const restored = await mount();
  expect(
    await restored.editorRef.value.editor
      .getJSON()
      .content[0].content[0].attrs.file.text()
  ).toBe('new');
});

test('stale editor cannot erase another editor pending submission', async () => {
  const original = await mount();
  const editor = original.editorRef.value.editor;
  renderImage({
    editor,
    file: new File(['x'], 'x.png', { type: 'image/png' }),
  });
  const stale = await mount();
  let posts = 0;
  vi.spyOn(window, 'fetch').mockImplementation(async (input) => {
    const path = new URL(String(input), location.href).pathname;
    const headers = { 'Content-Type': 'application/json' };
    if (path.endsWith('/upload'))
      return new Response(
        JSON.stringify([{ uploadId: 'one', url: '/one.png', expiresAt: '' }]),
        { headers }
      );
    if (path.endsWith('/submissions'))
      return new Response(JSON.stringify({ id: 'ticket' }), { headers });
    if (path.endsWith('/submissions/ticket'))
      return new Response(JSON.stringify({ state: 'UNKNOWN' }), { headers });
    posts++;
    return new Response('{}', { status: 500, headers });
  });
  await uploadEditorFiles(editor, '');
  const url = '/apis/api.halo.run/v1alpha1/comments';
  await expect(
    uploadSession(editor).submit(
      url,
      { content: editor.getHTML() },
      uploadedIds(editor),
      {},
      ''
    )
  ).rejects.toThrow();
  const other = stale.editorRef.value.editor;
  other.commands.clearContent();
  other.commands.setContent('<p>changed</p>');
  await expect(
    uploadSession(other).submit(url, { content: other.getHTML() }, [], {}, '')
  ).rejects.toThrow('being confirmed');
  expect(posts).toBe(1);
  stale.remove();
  const restored = await mount();
  expect(
    uploadSession(restored.editorRef.value.editor).snapshot().pending?.id
  ).toBe('ticket');
});

test('text drafts work when randomUUID is unavailable', async () => {
  vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
    throw new TypeError('unavailable');
  });
  const form = await mount();
  form.editorRef.value.editor.commands.setContent('<p>HTTP draft</p>');
  expect(form.getDraftSnapshot().content).toContain('HTTP draft');
});

test('ticket writes are conditional and survive document revision mismatches', async () => {
  const { readUploadDraft, writeUploadDraft } = await import(
    '../src/utils/upload-draft.ts'
  );
  const key = 'ticket-cas';
  localStorage.setItem(key, JSON.stringify({ revision: 'one' }));
  const draft = (id) => ({
    revision: 'one',
    document: { type: 'doc', content: [] },
    session: {
      token: 'a'.repeat(64),
      pending: id ? { id, fingerprint: 'body' } : undefined,
    },
  });
  const results = await Promise.all([
    writeUploadDraft(key, 'one', draft('winner'), false, {}),
    writeUploadDraft(key, 'one', draft('loser'), false, {}),
  ]);
  expect(results).toEqual([true, false]);
  expect(
    await writeUploadDraft(key, 'one', draft(), false, {
      previousPendingId: 'loser',
    })
  ).toBe(false);
  localStorage.setItem(key, JSON.stringify({ revision: 'newer' }));
  const restored = await readUploadDraft(key, 'newer');
  expect(restored.document).toBeUndefined();
  expect(restored.session.pending.id).toBe('winner');
  localStorage.setItem(key, JSON.stringify({ revision: 'one' }));
  expect(
    await writeUploadDraft(key, 'one', draft(), false, {
      previousPendingId: 'winner',
    })
  ).toBe(true);
  expect(await readUploadDraft(key, 'one')).toBeUndefined();
});

test('HTML fallback excludes local images whose blob source was sanitized away', async () => {
  const form = await mount();
  renderImage({
    editor: form.editorRef.value.editor,
    file: new File(['x'], 'x.png', { type: 'image/png' }),
  });
  const snapshot = form.getDraftSnapshot();
  localStorage.setItem(
    snapshot.key,
    JSON.stringify({ ...snapshot, revision: 'unsaved' })
  );
  form.remove();
  const restored = await mount();
  expect(restored.editorRef.value.editor.getHTML()).not.toContain('<img');
});

test('another pending ticket never replaces the upload token of a newer image draft', async () => {
  const { readUploadDraft, writeUploadDraft } = await import(
    '../src/utils/upload-draft.ts'
  );
  const key = 'different-upload-owners';
  localStorage.setItem(key, JSON.stringify({ revision: 'one' }));
  await writeUploadDraft(
    key,
    'one',
    {
      revision: 'one',
      session: {
        token: 'owner-a',
        pending: { id: 'a-ticket', fingerprint: 'a-body', token: 'owner-a' },
      },
    },
    false,
    {}
  );
  localStorage.setItem(key, JSON.stringify({ revision: 'two' }));
  await writeUploadDraft(
    key,
    'two',
    {
      revision: 'two',
      document: {
        type: 'doc',
        content: [
          { type: 'image', attrs: { src: '/b.png', uploadId: 'b-image' } },
        ],
      },
      session: { token: 'owner-b' },
    },
    true
  );
  const restored = await readUploadDraft(key, 'two');
  expect(restored.session.token).toBe('owner-b');
  expect(restored.session.pending.token).toBe('owner-a');
  expect(restored.document.content[0].attrs.uploadId).toBe('b-image');
});

test('recovery uses the ticket token while new images keep their own upload token', async () => {
  const { UploadSession } = await import('../src/utils/upload-session.ts');
  const url = '/apis/api.halo.run/v1alpha1/comments';
  const body = { content: 'old' };
  const requests = [];
  let stored = {
    token: 'image-owner',
    pending: {
      id: 'old-ticket',
      token: 'ticket-owner',
      fingerprint: JSON.stringify({ url, body, ids: ['old-image'] }),
    },
  };
  vi.spyOn(window, 'fetch').mockImplementation(async (input, options) => {
    const path = new URL(String(input), location.href).pathname;
    const token = new Headers(options.headers).get('X-Comment-Upload-Token');
    requests.push({ path, token });
    const headers = { 'Content-Type': 'application/json' };
    if (path.endsWith('/old-ticket'))
      return new Response(JSON.stringify({ state: 'ISSUED' }), { headers });
    if (path.endsWith('/submissions'))
      return new Response(JSON.stringify({ id: 'new-ticket' }), { headers });
    return new Response('{}', { status: 400, headers });
  });
  const session = new UploadSession(
    stored,
    async () => {
      stored = session.snapshot();
    },
    async () => stored
  );
  await expect(
    session.submit(url, body, ['old-image'], {}, '')
  ).rejects.toThrow();
  expect(requests[0].token).toBe('ticket-owner');
  expect(requests[1].token).toBe('ticket-owner');
  expect(stored.pending).toBeUndefined();
  await expect(
    session.submit(url, { content: 'new' }, ['new-image'], {}, '')
  ).rejects.toThrow();
  expect(requests[2].token).toBe('image-owner');
  expect(requests[3].token).toBe('image-owner');
});

test('a lost cancellation race preserves pending and never sends changed content', async () => {
  const { UploadSession } = await import('../src/utils/upload-session.ts');
  let status = 'ISSUED';
  const requests = [];
  vi.spyOn(window, 'fetch').mockImplementation(async (_input, options = {}) => {
    requests.push(options.method || 'GET');
    const headers = { 'Content-Type': 'application/json' };
    if (options.method === 'DELETE') {
      status = 'PROCESSING';
      return new Response('{}', { status: 409, headers });
    }
    return new Response(JSON.stringify({ state: status }), { headers });
  });
  const session = new UploadSession({
    token: 'images',
    pending: { id: 'ticket', token: 'ticket-owner', fingerprint: 'old' },
  });
  await expect(
    session.submit('/comments', { content: 'new' }, [], {}, '')
  ).rejects.toThrow();
  expect(session.snapshot().pending.id).toBe('ticket');
  await expect(
    session.submit('/comments', { content: 'new' }, [], {}, '')
  ).rejects.toThrow('being confirmed');
  expect(requests).toEqual(['GET', 'DELETE', 'GET']);
});
