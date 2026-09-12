import assert from 'node:assert/strict';
import { closeHistory, history, redo, undo } from '@tiptap/pm/history';
import { Fragment, Schema, Slice } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';
import { test } from 'vitest';
import { ImageUploadState } from '../src/extension/image-upload-state.ts';

const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*' },
    text: { group: 'inline' },
    image: {
      inline: true,
      group: 'inline',
      attrs: {
        src: {},
        width: { default: null },
        uploadId: { default: null },
        local: { default: false },
        file: { default: null },
      },
    },
  },
});

function pastedImage(src: string, attrs = {}) {
  return new Slice(
    Fragment.from(schema.nodes.image.create({ src, ...attrs })),
    0,
    0
  );
}

test('cut and pasted local image recovers its original File', () => {
  const state = new ImageUploadState();
  const file = new File(['svg'], 'test.svg', { type: 'image/svg+xml' });
  state.rememberLocal('blob:local', file);
  const restored = state
    .restorePasted(pastedImage('blob:local', { width: 120 }))
    .content.child(0);
  assert.equal(restored.attrs.file, file);
  assert.equal(restored.attrs.local, true);
  assert.equal(restored.attrs.width, 120);
});

test('both original blob and uploaded URL restore the same upload identity', () => {
  const state = new ImageUploadState();
  state.rememberUploaded('blob:local', {
    uploadId: 'upload-one',
    url: '/image.svg',
    expiresAt: '',
  });
  for (const src of ['blob:local', '/image.svg']) {
    const attrs = state.restorePasted(pastedImage(src)).content.child(0).attrs;
    assert.equal(attrs.uploadId, 'upload-one');
    assert.equal(attrs.src, '/image.svg');
    assert.equal(attrs.local, false);
    assert.equal(attrs.file, null);
  }
});

test('untrusted pasted attributes cannot claim another upload', () => {
  const state = new ImageUploadState();
  const attrs = state
    .restorePasted(
      pastedImage('/unknown.svg', {
        uploadId: 'forged',
        local: true,
        file: new File(['x'], 'x'),
      })
    )
    .content.child(0).attrs;
  assert.equal(attrs.uploadId, null);
  assert.equal(attrs.local, false);
  assert.equal(attrs.file, null);
});

test('nested pasted content preserves slice boundaries and text', () => {
  const state = new ImageUploadState();
  state.rememberUploaded('blob:local', {
    uploadId: 'known',
    url: '/known.svg',
    expiresAt: '',
  });
  const paragraph = schema.nodes.paragraph.create(null, [
    schema.text('before'),
    schema.nodes.image.create({ src: '/known.svg' }),
    schema.text('after'),
  ]);
  const restored = state.restorePasted(
    new Slice(Fragment.from(paragraph), 1, 1)
  );
  assert.equal(restored.openStart, 1);
  assert.equal(restored.openEnd, 1);
  assert.equal(restored.content.child(0).textContent, 'beforeafter');
  assert.equal(restored.content.child(0).child(1).attrs.uploadId, 'known');
  assert.equal(
    new ImageUploadState().restorePasted(restored).content.child(0).child(1)
      .attrs.uploadId,
    null
  );
});

test('undo and redo reuse the confirmed attachment without losing image dimensions', () => {
  const uploads = new ImageUploadState();
  const file = new File(['svg'], 'test.svg');
  const original = schema.nodes.image.create({
    src: 'blob:history',
    local: true,
    file,
    width: 120,
  });
  uploads.rememberLocal('blob:history', file);
  let editor = EditorState.create({
    doc: schema.nodes.doc.create(
      null,
      schema.nodes.paragraph.create(null, original)
    ),
    plugins: [history()],
  });
  editor = editor.apply(closeHistory(editor.tr.delete(1, 2)));
  editor = editor.apply(editor.tr.insert(1, original));
  uploads.rememberUploaded('blob:history', {
    uploadId: 'confirmed',
    url: '/confirmed.svg',
    expiresAt: '',
  });
  editor = editor.apply(
    uploads.restoreUploaded(editor.tr).setMeta('addToHistory', false)
  );
  assert.equal(
    undo(editor, (tr) => {
      editor = editor.apply(tr);
    }),
    true
  );
  assert.equal(editor.doc.child(0).child(0).attrs.local, true);
  editor = editor.apply(
    uploads.restoreUploaded(editor.tr).setMeta('addToHistory', false)
  );
  assert.equal(editor.doc.child(0).child(0).attrs.uploadId, 'confirmed');
  assert.equal(
    redo(editor, (tr) => {
      editor = editor.apply(tr);
    }),
    true
  );
  editor = editor.apply(
    uploads.restoreUploaded(editor.tr).setMeta('addToHistory', false)
  );
  const attrs = editor.doc.child(0).child(0).attrs;
  assert.equal(attrs.src, '/confirmed.svg');
  assert.equal(attrs.uploadId, 'confirmed');
  assert.equal(attrs.local, false);
  assert.equal(attrs.file, null);
  assert.equal(attrs.width, 120);
  assert.equal(uploads.restoreUploaded(editor.tr).docChanged, false);
});

test('unconfirmed local files remain uploadable and do not inherit another session', () => {
  const file = new File(['new'], 'new.svg');
  const node = schema.nodes.image.create({
    src: 'blob:new',
    file,
    local: true,
  });
  const editor = EditorState.create({
    doc: schema.nodes.doc.create(
      null,
      schema.nodes.paragraph.create(null, node)
    ),
  });
  const uploads = new ImageUploadState();
  uploads.rememberLocal('blob:new', file);
  assert.equal(uploads.restoreUploaded(editor.tr).docChanged, false);
  assert.equal(
    new ImageUploadState().restoreUploaded(editor.tr).docChanged,
    false
  );
});
