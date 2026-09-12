import { msg, str } from '@lit/localize';
import { type Editor, Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ToastManager } from '../lit-toast';
import {
  imageUploadState,
  renderImage,
  resetUploadSession,
} from './uploaded-images';

export {
  resetUploadSession,
  uploadEditorFiles,
  uploadedIds,
  uploadSession,
} from './uploaded-images';

export interface EditorUploadOptions {
  baseUrl: string;
  enabled: () => boolean;
  maxFileSize: () => number;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    upload: {
      uploadFile: () => ReturnType;
    };
  }
}

export const EditorUpload = Extension.create<EditorUploadOptions>({
  name: 'upload',

  onDestroy() {
    resetUploadSession(this.editor);
  },

  addOptions() {
    return {
      baseUrl: '',
      enabled: () => false,
      maxFileSize: () => 10,
    };
  },

  addCommands() {
    return {
      uploadFile: () => createUploadCommand(this.options),
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: [Image.name],
        attributes: {
          uploadId: {
            default: null,
            parseHTML: () => null,
            renderHTML() {
              return null;
            },
          },
          local: {
            default: false,
            parseHTML: () => false,
            renderHTML() {
              return null;
            },
          },
          file: {
            default: null,
            parseHTML: () => null,
            renderHTML() {
              return null;
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    const { editor }: { editor: Editor } = this;

    return [
      new Plugin({
        key: new PluginKey('upload'),
        props: {
          transformPasted: (slice) =>
            imageUploadState(editor).restorePasted(slice),
          handlePaste: (_view, event) =>
            handlePaste(event, editor, this.options),
          handleDrop: (_view, event) => handleDrop(event, editor, this.options),
        },
      }),
    ];
  },
});

function isExcelPasted(clipboardData: ClipboardEvent['clipboardData']) {
  if (!clipboardData) {
    return false;
  }

  const types = clipboardData.types;
  if (
    types.includes('application/vnd.ms-excel') ||
    types.includes(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  ) {
    return true;
  }

  if (!types.includes('text/html')) {
    return false;
  }
  return isExcelHtml(clipboardData);
}

function isExcelHtml(clipboardData: DataTransfer) {
  try {
    const html = clipboardData.getData('text/html');
    return [
      'ProgId="Excel.Sheet"',
      'xmlns:x="urn:schemas-microsoft-com:office:excel"',
      'urn:schemas-microsoft-com:office:spreadsheet',
      '<x:ExcelWorkbook>',
    ].some((marker) => html.includes(marker));
  } catch (e) {
    console.warn('Failed to read clipboard HTML data:', e);
  }

  return false;
}

function containsFileClipboardIdentifier(types: readonly string[]) {
  const fileTypes = ['files', 'application/x-moz-file', 'public.file-url'];
  return types.some((type) => fileTypes.includes(type.toLowerCase()));
}

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  jif: 'image/jpeg',
  jfif: 'image/jpeg',
  jfi: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
};

function fileError(file: File, maxFileSize: number) {
  if (!Number.isInteger(maxFileSize) || maxFileSize < 1 || maxFileSize > 2047) {
    return msg(
      'Image upload is unavailable. Please contact the site administrator.'
    );
  }
  if (file.size > maxFileSize * 1024 * 1024) {
    return msg(str`Image size must not exceed ${maxFileSize} MiB.`);
  }
  const type = IMAGE_TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''];
  if (
    !file.size ||
    !type ||
    (file.type &&
      file.type !== 'application/octet-stream' &&
      file.type !== type)
  ) {
    return msg('Only JPEG, PNG, GIF, WebP, and AVIF images are supported.');
  }
  return undefined;
}

function canUpload(editor: Editor, enabled: () => boolean) {
  if (!enabled()) {
    return false;
  }
  return editor.isEditable;
}

function createUploadCommand(options: EditorUploadOptions) {
  return ({ editor }: { editor: Editor }) => openFilePicker(editor, options);
}

function openFilePicker(editor: Editor, options: EditorUploadOptions) {
  if (!canUpload(editor, options.enabled)) {
    return false;
  }
  const input = document.createElement('input');
  input.accept = Object.values(IMAGE_TYPES).join(',');
  input.type = 'file';
  input.multiple = true;
  input.onchange = () => acceptSelectedFiles(input, editor, options);
  input.click();
  return true;
}

function acceptSelectedFiles(
  input: HTMLInputElement,
  editor: Editor,
  options: EditorUploadOptions
) {
  if (!canUpload(editor, options.enabled)) {
    return;
  }
  if (editor.isDestroyed) {
    return;
  }
  if (!input.files) {
    return;
  }
  handleFiles(Array.from(input.files), editor, options);
}

function handleFiles(
  files: File[],
  editor: Editor,
  options: EditorUploadOptions
) {
  const errors = new Set<string>();
  for (const file of files) {
    const error = fileError(file, options.maxFileSize());
    if (error) errors.add(error);
    else renderImage({ file, editor });
  }
  if (errors.size) new ToastManager().error([...errors].join('; '));
}

function handlePaste(
  event: ClipboardEvent,
  editor: Editor,
  options: EditorUploadOptions
) {
  if (!canUpload(editor, options.enabled)) {
    return false;
  }

  if (!event.clipboardData) {
    return false;
  }

  const types = event.clipboardData.types;
  if (!containsFileClipboardIdentifier(types)) {
    return false;
  }

  // If the copied content is Excel, do not process it.
  if (isExcelPasted(event.clipboardData)) {
    return false;
  }

  const files = Array.from(event.clipboardData.files).filter((file) =>
    file.type.startsWith('image/')
  );

  if (files.length) {
    event.preventDefault();
    handleFiles(files, editor, options);
    return true;
  }

  return false;
}

function handleDrop(
  event: DragEvent,
  editor: Editor,
  options: EditorUploadOptions
) {
  if (!canUpload(editor, options.enabled)) {
    return false;
  }

  if (!event.dataTransfer) {
    return false;
  }

  const hasFiles = event.dataTransfer.files.length > 0;
  if (!hasFiles) {
    return false;
  }

  // Prevent file drops from navigating away and losing the comment draft.
  event.preventDefault();
  handleFiles(Array.from(event.dataTransfer.files), editor, options);
  return true;
}
