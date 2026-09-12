import { expect, test, vi } from 'vitest';
import '../src/base-form.ts';
import { ToastManager } from '../src/lit-toast';

async function mount(maxFileSize) {
  const form = document.createElement('base-form');
  form.name = `image-limits-${Math.random()}`;
  form.configMapData = {
    basic: {},
    editor: {
      enableUpload: true,
      upload: { allowAnonymous: true, maxFileSize },
    },
  };
  document.body.append(form);
  await vi.waitFor(() => expect(form.editorRef.value?.editor).toBeTruthy());
  return form;
}

function filesEvent(files, kind) {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  return kind === 'paste'
    ? new ClipboardEvent('paste', { clipboardData: data, cancelable: true })
    : new DragEvent('drop', { dataTransfer: data, cancelable: true });
}

function images(editor) {
  const result = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') result.push(node);
  });
  return result;
}

for (const kind of ['paste', 'drop', 'picker']) {
  test(`${kind} rejects oversized and unsupported images, preserving valid files`, async () => {
    const error = vi
      .spyOn(ToastManager.prototype, 'error')
      .mockImplementation(() => {});
    const form = await mount(1);
    const editor = form.editorRef.value.editor;
    const files = [
      new File(['valid'], 'small.png', { type: 'image/png' }),
      new File([new Uint8Array(1024 * 1024 + 1)], 'large.png', {
        type: 'image/png',
      }),
      new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' }),
      new File(['conflicting'], 'image.png', { type: 'image/jpeg' }),
    ];
    if (kind === 'picker') {
      let input;
      vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(
        function () {
          input = this;
        }
      );
      editor.commands.uploadFile();
      expect(input.accept).not.toContain('*');
      expect(input.accept).not.toContain('svg');
      const data = new DataTransfer();
      for (const file of files) data.items.add(file);
      input.files = data.files;
      input.dispatchEvent(new Event('change'));
    } else {
      const event = filesEvent(files, kind);
      editor.view.someProp(
        kind === 'paste' ? 'handlePaste' : 'handleDrop',
        (handle) => handle(editor.view, event)
      );
      expect(event.defaultPrevented).toBe(true);
    }
    expect(images(editor)).toHaveLength(1);
    expect(images(editor)[0].attrs.file.name).toBe('small.png');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('1 MiB'));
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Only JPEG'));
  });
}

test('uses the legacy default and reads changed configuration without remounting', async () => {
  const error = vi
    .spyOn(ToastManager.prototype, 'error')
    .mockImplementation(() => {});
  const form = await mount();
  const editor = form.editorRef.value.editor;
  const file = new File([new Uint8Array(2 * 1024 * 1024)], 'image.png', {
    type: 'image/png',
  });
  const drop = () =>
    editor.view.someProp('handleDrop', (handle) =>
      handle(editor.view, filesEvent([file], 'drop'))
    );
  drop();
  expect(images(editor)).toHaveLength(1);
  form.configMapData = {
    ...form.configMapData,
    editor: {
      enableUpload: true,
      upload: { allowAnonymous: true, maxFileSize: 1 },
    },
  };
  await form.updateComplete;
  await form.editorRef.value.updateComplete;
  drop();
  expect(images(editor)).toHaveLength(1);
  expect(error).toHaveBeenCalledWith(expect.stringContaining('1 MiB'));
  form.configMapData = {
    ...form.configMapData,
    editor: {
      enableUpload: true,
      upload: { allowAnonymous: true, maxFileSize: 2 },
    },
  };
  await form.updateComplete;
  await form.editorRef.value.updateComplete;
  drop();
  expect(images(editor)).toHaveLength(2);
});
