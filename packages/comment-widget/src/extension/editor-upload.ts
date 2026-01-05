import type { Attachment } from '@halo-dev/api-client';
import { type Editor, Extension } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import type { Node } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ofetch } from 'ofetch';
import { ToastManager } from '../lit-toast';

export interface EditorUploadOptions {
  baseUrl: string;
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

  addOptions() {
    return {
      baseUrl: '',
    };
  },

  addCommands() {
    return {
      uploadFile:
        () =>
        ({ editor }: { editor: Editor }) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = () => {
            const files = input.files;
            if (files) {
              uploadFiles(Array.from(files), this.options.baseUrl).then(
                (attachments) => {
                  handleInsertAttachments({ editor, attachments });
                }
              );
            }
          };
          input.click();
          return true;
        },
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: [Image.name],
        attributes: {
          local: {
            default: false,
            renderHTML() {
              return null;
            },
          },
          file: {
            default: null,
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
          handlePaste: (view, event: ClipboardEvent) => {
            if (view.props.editable && !view.props.editable(view.state)) {
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

            const files = Array.from(event.clipboardData.files);

            if (files.length) {
              event.preventDefault();
              files.forEach((file) => {
                handleFileEvent({ editor, file });
              });
              return true;
            }

            return false;
          },
          handleDrop: (view, event) => {
            if (view.props.editable && !view.props.editable(view.state)) {
              return false;
            }

            if (!event.dataTransfer) {
              return false;
            }

            const hasFiles = event.dataTransfer.files.length > 0;
            if (!hasFiles) {
              return false;
            }

            event.preventDefault();

            const files = Array.from(event.dataTransfer.files) as File[];
            if (files.length) {
              event.preventDefault();
              files.forEach((file: File) => {
                // TODO: For drag-and-drop uploaded files,
                // perhaps it is necessary to determine the
                // current position of the drag-and-drop
                // instead of inserting them directly at the cursor.
                handleFileEvent({ editor, file });
              });
              return true;
            }

            return false;
          },
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

  if (types.includes('text/html')) {
    try {
      const html = clipboardData.getData('text/html');
      if (
        html.includes('ProgId="Excel.Sheet"') ||
        html.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"') ||
        html.includes('urn:schemas-microsoft-com:office:spreadsheet') ||
        html.includes('<x:ExcelWorkbook>')
      ) {
        return true;
      }
    } catch (e) {
      console.warn('Failed to read clipboard HTML data:', e);
    }
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

const handleInsertAttachments = ({
  editor,
  attachments,
}: {
  editor: Editor;
  attachments: Attachment[];
}) => {
  if (!editor || !attachments.length) {
    return;
  }

  for (const attachment of attachments) {
    const mediaType = attachment.spec.mediaType;
    const permalink = attachment.status?.permalink;
    if (!mediaType) {
      continue;
    }
    if (mediaType.startsWith('image/')) {
      const node = editor.view.props.state.schema.nodes[Image.name].create({
        src: permalink,
      });
      editor.view.dispatch(editor.view.state.tr.replaceSelectionWith(node));
    }
  }
};

/**
 * Handles file events, determining if the file is an image and triggering the appropriate upload process.
 *
 * @param {FileProps} { file, editor } - File and editor instances
 * @returns {boolean} - True if a file is handled, otherwise false
 */
const handleFileEvent = ({ file, editor }: FileProps) => {
  if (!file) {
    return false;
  }

  if (file.type.startsWith('image/')) {
    renderImage({ file, editor });
    return true;
  }

  return true;
};

const getFileBlobUrl = (file: File) => {
  return URL.createObjectURL(file);
};

const renderImage = ({ file, editor }: FileProps) => {
  const { view } = editor;
  const blobUrl = getFileBlobUrl(file);

  const node = view.props.state.schema.nodes[Image.name].create({
    src: blobUrl,
    file: file,
    local: true,
  });
  editor.view.dispatch(editor.view.state.tr.replaceSelectionWith(node));
};

type LocalNode = {
  node: Node;
  pos: number;
  parent: Node | null;
  index: number;
};

type ErrorResponse = {
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
  requestId?: string;
  timestamp?: string;
  type?: string;
};

const getLocalNodes = (editor: Editor) => {
  const { state } = editor;
  const localNodes: LocalNode[] = [];
  state.doc.descendants(
    (node: Node, pos: number, parent: Node | null, index: number) => {
      if (node.attrs.local) {
        localNodes.push({ node, pos, parent, index });
      }
    }
  );
  return localNodes;
};

const uploadFileAndReplaceNode = async (
  editor: Editor,
  nodes: LocalNode[],
  baseUrl?: string
) => {
  try {
    const files = Array.from(nodes).map((node) => node.node.attrs.file);
    const attachments = await uploadFiles(files, baseUrl);
    for (const [index, attachment] of attachments.entries()) {
      const permalink = attachment.status?.permalink;
      const node = nodes[index];
      if (node) {
        let tr = editor.state.tr;
        tr = tr.setNodeAttribute(node.pos, 'src', permalink);
        editor.view.dispatch(tr);
      }
    }
    return true;
  } catch (error) {
    const toastManager = new ToastManager();
    toastManager.error(error instanceof Error ? error.message : '未知错误');
  }

  return false;
};

const uploadFiles = async (
  files: File[],
  baseUrl?: string
): Promise<Attachment[]> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const attachments = await ofetch(
      `${baseUrl ?? ''}/apis/api.commentwidget.halo.run/v1alpha1/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    return attachments;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = (error as { data: ErrorResponse }).data;
      const title = errorData?.title || '上传失败';
      const detail = errorData?.detail || '';
      const message = detail ? `${title}: ${detail}` : title;
      throw new Error(message);
    }
    throw new Error('上传失败');
  }
};

/**
 * Upload all local images in the editor to the server
 * @param editor - The TipTap editor instance
 * @param baseUrl - The base URL for the upload endpoint
 * @returns Promise<boolean> - True if upload succeeds or no files to upload, false otherwise
 */
export const uploadEditorFiles = async (
  editor: Editor | undefined,
  baseUrl?: string
): Promise<boolean> => {
  if (!editor) {
    return true;
  }

  const localNodes = getLocalNodes(editor);
  if (localNodes.length === 0) {
    return true;
  }

  return await uploadFileAndReplaceNode(editor, localNodes, baseUrl);
};
