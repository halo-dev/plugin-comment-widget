import type { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import {
  type EditorState,
  Plugin,
  PluginKey,
  TextSelection,
} from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';

function isImageBoundary(state: EditorState) {
  const { selection } = state;
  if (!(selection instanceof TextSelection)) {
    return false;
  }
  if (!selection.empty) {
    return false;
  }
  if (selection.$from.nodeBefore?.type.name === Image.name) {
    return true;
  }
  return selection.$from.nodeAfter?.type.name === Image.name;
}

function showCaret(editor: Editor, state: EditorState) {
  if (!editor.isEditable) {
    return false;
  }
  if (!editor.isFocused) {
    return false;
  }
  return isImageBoundary(state);
}

function caretClass(editor: Editor, state: EditorState) {
  if (showCaret(editor, state)) {
    return 'image-caret-active';
  }
  return '';
}

function createCaret(view: EditorView) {
  const caret = view.dom.ownerDocument.createElement('span');
  caret.className = 'image-caret';
  caret.setAttribute('aria-hidden', 'true');
  return caret;
}

function caretDecorations(editor: Editor, state: EditorState) {
  if (!showCaret(editor, state)) {
    return null;
  }
  // Chromium can omit the caret beside a positioned, non-editable image.
  // This decoration restores its visual indicator without changing TextSelection.
  return DecorationSet.create(state.doc, [
    Decoration.widget(state.selection.from, createCaret, {
      side: -1,
      key: 'image-caret',
      ignoreSelection: true,
    }),
  ]);
}

export const EditorImage = Image.extend({
  addProseMirrorPlugins() {
    const { editor } = this;
    return [
      ...(this.parent?.() ?? []),
      new Plugin({
        key: new PluginKey('imageCaret'),
        props: {
          attributes: (state) => ({ class: caretClass(editor, state) }),
          decorations: (state) => caretDecorations(editor, state),
        },
      }),
    ];
  },
});
