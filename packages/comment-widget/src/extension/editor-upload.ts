import { type Editor, Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { Plugin, PluginKey } from '@tiptap/pm/state';
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
    };
  },

  addCommands() {
    return {
      uploadFile: () => createUploadCommand(this.options.enabled),
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
            handlePaste(event, editor, this.options.enabled),
          handleDrop: (_view, event) =>
            handleDrop(event, editor, this.options.enabled),
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

type FileProps = {
  file: File;
  editor: Editor;
};

/**
 * Handles file events, determining if the file is an image and triggering the appropriate upload process.
 *
 * @param {FileProps} { file, editor } - File and editor instances
 * @returns {boolean} - True if a file is handled, otherwise false
 */
function handleFileEvent({ file, editor }: FileProps) {
  if (!file) {
    return false;
  }

  if (file.type.startsWith('image/')) {
    renderImage({ file, editor });
    return true;
  }

  return false;
}

function canUpload(editor: Editor, enabled: () => boolean) {
  if (!enabled()) {
    return false;
  }
  return editor.isEditable;
}

function createUploadCommand(enabled: () => boolean) {
  return ({ editor }: { editor: Editor }) => openFilePicker(editor, enabled);
}

function openFilePicker(editor: Editor, enabled: () => boolean) {
  if (!canUpload(editor, enabled)) {
    return false;
  }
  const input = document.createElement('input');
  input.accept = 'image/*';
  input.type = 'file';
  input.multiple = true;
  input.onchange = () => acceptSelectedFiles(input, editor, enabled);
  input.click();
  return true;
}

function acceptSelectedFiles(
  input: HTMLInputElement,
  editor: Editor,
  enabled: () => boolean
) {
  if (!canUpload(editor, enabled)) {
    return;
  }
  if (editor.isDestroyed) {
    return;
  }
  if (!input.files) {
    return;
  }
  handleFiles(Array.from(input.files), editor);
}

function handleFiles(files: File[], editor: Editor) {
  for (const file of files) {
    handleFileEvent({ editor, file });
  }
}

function handlePaste(
  event: ClipboardEvent,
  editor: Editor,
  enabled: () => boolean
) {
  if (!canUpload(editor, enabled)) {
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
    handleFiles(files, editor);
    return true;
  }

  return false;
}

function handleDrop(event: DragEvent, editor: Editor, enabled: () => boolean) {
  if (!canUpload(editor, enabled)) {
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
  handleFiles(Array.from(event.dataTransfer.files), editor);
  return true;
}
