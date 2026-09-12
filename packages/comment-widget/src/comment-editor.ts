import { msg } from '@lit/localize';
import type { Editor } from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import './emoji-button';
import contentStyles from './styles/content.css?inline';
import './comment-editor-skeleton';
import { consume } from '@lit/context';
import { property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { when } from 'lit/directives/when.js';
import { baseUrlContext } from './context';
import {
  restoreUploadDraft,
  saveUploadDraft,
  uploadSession,
} from './extension/uploaded-images';
import { ToastManager } from './lit-toast';
import baseStyles from './styles/base';
import { cleanHtml } from './utils/html';
import { readUploadDraft } from './utils/upload-draft';

interface ActionItem {
  name?: string;
  displayName?: () => string;
  type: 'action' | 'separator';
  icon?: string;
  run?: (editor?: Editor) => void;
}

const actionItems: ActionItem[] = [
  {
    name: 'bold',
    displayName: () => msg('Bold'),
    type: 'action',
    icon: 'i-mingcute-bold-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleBold().run(),
  },
  {
    name: 'italic',
    displayName: () => msg('Italic'),
    type: 'action',
    icon: 'i-mingcute-italic-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleItalic().run(),
  },
  {
    name: 'underline',
    displayName: () => msg('Underline'),
    type: 'action',
    icon: 'i-mingcute-underline-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleUnderline().run(),
  },
  {
    name: 'strike',
    displayName: () => msg('Strike'),
    type: 'action',
    icon: 'i-mingcute-strikethrough-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleStrike().run(),
  },
  {
    name: 'code',
    displayName: () => msg('Code'),
    type: 'action',
    icon: 'i-mingcute-braces-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleCode().run(),
  },
  {
    type: 'separator',
  },
  {
    name: 'blockquote',
    displayName: () => msg('Blockquote'),
    type: 'action',
    icon: 'i-mingcute-quote-left-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleBlockquote().run(),
  },
  {
    name: 'codeBlock',
    displayName: () => msg('Code Block'),
    type: 'action',
    icon: 'i-mingcute-code-line',
    run: (editor?: Editor) => editor?.chain().focus().toggleCodeBlock().run(),
  },
];

const uploadActionItem: ActionItem = {
  name: 'upload',
  displayName: () => msg('Upload'),
  type: 'action',
  icon: 'i-mingcute-upload-line',
  run: (editor?: Editor) => editor?.chain().focus().uploadFile().run(),
};

export class CommentEditor extends LitElement {
  @consume({ context: baseUrlContext })
  @state()
  baseUrl = '';

  @property({ type: String })
  placeholder: string | undefined;

  @property({ type: String, attribute: 'initial-content' })
  initialContent = '';

  @property({ attribute: false })
  draftKey = '';

  @property({ attribute: false })
  draftRevision = '';

  get hasPendingUpload() {
    return !!this.editor && !!uploadSession(this.editor).snapshot().pending;
  }

  private draftSaveWarned = false;

  private reportDraftError = () => {
    if (this.draftSaveWarned) return;
    this.draftSaveWarned = true;
    new ToastManager().warn(
      msg('Unable to save image draft. Keep this page open.')
    );
  };

  private saveUploadDraft = async (sessionChange?: {
    previousPendingId?: string;
  }) => {
    if (this.editor) {
      return saveUploadDraft(
        this.editor,
        this.draftKey,
        this.draftRevision,
        sessionChange
      );
    }
    return false;
  };

  @property({ type: Boolean, attribute: 'keep-alive' })
  keepAlive = false;

  @property({ type: Boolean })
  enableEmoji = true;

  @property({ type: Boolean })
  enableUpload = false;

  @property({ type: Boolean })
  disabled = false;

  protected override updated(changes: PropertyValues) {
    if (changes.has('disabled')) {
      this.editor?.setEditable(!this.disabled, false);
    }
  }

  @state()
  editor: Editor | undefined;

  @state()
  loading = true;

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.createEditor();
  }

  async createEditor() {
    const { Editor } = await import('@tiptap/core');
    const { CharacterCount, Placeholder } = await import('@tiptap/extensions');
    const { StarterKit } = await import('@tiptap/starter-kit');
    const { CodeBlockShiki } = await import(
      'tiptap-extension-code-block-shiki'
    );
    const { EditorUpload } = await import('./extension/editor-upload');
    const { EditorImage } = await import('./extension/editor-image');

    const draft = await readUploadDraft(
      this.draftKey,
      this.draftRevision
    ).catch(this.reportDraftError);
    if (!this.isConnected) return;
    this.loading = false;

    this.editor = new Editor({
      editable: !this.disabled,
      element: this.shadowRoot?.getElementById('editor-container'),
      content: this.initialContent,
      editorProps: {
        attributes: {
          role: 'textbox',
          'aria-label': msg('Write a comment'),
          'aria-multiline': 'true',
        },
      },
      extensions: [
        StarterKit.configure({
          heading: false,
          link: {
            openOnClick: false,
            defaultProtocol: 'https',
            HTMLAttributes: {
              target: '_blank',
              rel: 'noopener noreferrer nofollow ugc',
            },
          },
          codeBlock: false,
        }),

        Placeholder.configure({
          placeholder: this.placeholder || msg('Write a comment'),
        }),

        CodeBlockShiki.configure({
          defaultTheme: 'github-dark',
        }),

        CharacterCount,

        EditorImage.configure({
          inline: true,
          resize: {
            enabled: true,
            alwaysPreserveAspectRatio: true,
            minWidth: 50,
            minHeight: 50,
            directions: ['right'],
          },
        }),

        EditorUpload.configure({
          enabled: () => this.enableUpload,
          baseUrl: this.baseUrl,
        }),
      ],
      onUpdate: () => {
        this.requestUpdate();
      },
      onSelectionUpdate: () => {
        this.requestUpdate();
      },
      onTransaction: () => {
        this.requestUpdate();
      },
    });

    restoreUploadDraft(
      this.editor,
      draft || undefined,
      async (previousPendingId) => {
        if (!(await this.saveUploadDraft({ previousPendingId }))) {
          throw new Error(
            msg('Your draft has changed. Reopen it before retrying.')
          );
        }
      },
      async () =>
        (await readUploadDraft(this.draftKey, this.draftRevision))?.session
    );

    this.editor.on('update', () => {
      this.draftRevision = Array.from(
        crypto.getRandomValues(new Uint8Array(16))
      )
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('');
      this.dispatchEvent(
        new CustomEvent('update', {
          detail: {
            revision: this.draftRevision,
            content: cleanHtml(this.editor?.getHTML()),
            characterCount: this.editor?.storage.characterCount.characters(),
          },
        })
      );
      void this.saveUploadDraft().catch(this.reportDraftError);
    });
  }

  override disconnectedCallback(): void {
    if (!this.keepAlive) {
      this.editor?.destroy();
      this.editor = undefined;
    }
    super.disconnectedCallback();
  }

  setFocus() {
    setTimeout(() => {
      this.editor?.chain().focus().run();
    }, 100);
  }

  reset() {
    if (!this.editor) {
      return;
    }
    this.editor.commands.setContent('', { emitUpdate: false });
    // A new EditorState clears undo history after a successful submission.
    const { doc, schema, plugins } = this.editor.state;
    this.editor.view.updateState(EditorState.create({ doc, schema, plugins }));
  }

  onEmojiSelect(e: CustomEvent) {
    if (!this.disabled) {
      this.editor?.chain().focus().insertContent(e.detail.native).run();
    }
  }

  private runAction(item: ActionItem, editor?: Editor) {
    if (!editor?.isEditable) {
      return;
    }
    item.run?.(editor);
  }

  protected override render() {
    return html`
      ${when(this.loading, () => html`<comment-editor-skeleton></comment-editor-skeleton>`)}
      <div
        class="border rounded-base border-solid border-muted-1 focus-within:border-primary-1 focus-within:shadow-input transition-[border-color,box-shadow]"
        ?hidden=${this.loading}
        @click=${this.setFocus}
      >
        <div
          id="editor-container"
          class="p-4 content !bg-transparent"
        ></div>
        <ul class="list-none p-2.5 flex gap-1 m-0 items-center overflow-x-auto">
          ${repeat(actionItems, (item) =>
            this.renderActionItem(item, this.editor)
          )}
          ${when(this.enableUpload || this.enableEmoji, () =>
            this.renderActionItem({ type: 'separator' })
          )}
          ${when(this.enableUpload, () => this.renderActionItem(uploadActionItem, this.editor))}
          ${when(
            this.enableEmoji,
            () => html`
            <li class="flex items-center">
              <emoji-button @emoji-select=${this.onEmojiSelect}></emoji-button>
            </li>
          `
          )}
        </ul>
      </div>`;
  }

  private renderActionItem(item: ActionItem, editor?: Editor) {
    if (item.type === 'separator') {
      return html`<li class="flex items-center" aria-hidden="true">
        <div class="w-1px bg-muted-1 rounded-full h-3"></div>
      </li>`;
    }

    if (item.type === 'action') {
      const isActive = item.name ? editor?.isActive(item.name) : false;
      return html`
        <li>
          <button
            type="button"
            aria-label=${ifDefined(item.displayName?.())}
            aria-pressed=${isActive}
            title=${ifDefined(item.displayName?.())}
            @click=${() => this.runAction(item, editor)}
            class="size-7 hover:bg-muted-3 active:bg-muted-2 ${isActive ? 'bg-muted-3 text-text-1' : 'text-text-3 hover:text-text-1'} rounded-base flex items-center justify-center cursor-pointer transition-colors"
          >
            <i class="size-5 ${item.icon}" aria-hidden="true"></i>
          </button>
        </li>
      `;
    }

    return;
  }

  static override styles = [
    ...baseStyles,
    unsafeCSS(contentStyles),
    css`

      :host {
        display: block;
        width: 100%;
      }

      .tiptap {
        outline: none;
        border: none;
      }

      .tiptap.image-caret-active {
        caret-color: transparent;
      }

      .tiptap .image-caret {
        display: inline-block;
        position: relative;
        z-index: 1;
        width: 0;
        height: 1em;
        vertical-align: text-bottom;
        pointer-events: none;
      }

      .tiptap .image-caret::after {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        border-left: 1px solid currentColor;
        animation: image-caret-blink 1.1s step-end infinite;
      }

      @keyframes image-caret-blink {
        50% { opacity: 0; }
      }

      .tiptap p {
        padding: 0;
        margin-bottom: 10px;
      }

      .tiptap p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
        color: var(--halo-cw-text-3-color, #475569);
      }

      .tiptap code br {
        display: block;
      }

      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-editor') ||
  customElements.define('comment-editor', CommentEditor);

declare global {
  interface HTMLElementTagNameMap {
    'comment-editor': CommentEditor;
  }
}
