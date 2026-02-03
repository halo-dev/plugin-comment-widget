import { msg } from '@lit/localize';
import type { Editor } from '@tiptap/core';
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
import baseStyles from './styles/base';
import { cleanHtml } from './utils/html';

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

  @property({ type: Boolean, attribute: 'keep-alive' })
  keepAlive = false;

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
    const { Placeholder } = await import('@tiptap/extensions');
    const { StarterKit } = await import('@tiptap/starter-kit');
    const { CodeBlockShiki } = await import(
      'tiptap-extension-code-block-shiki'
    );
    const { CharacterCount } = await import('@tiptap/extensions');
    const { EditorUpload } = await import('./extension/editor-upload');
    const { Image } = await import('@tiptap/extension-image');

    this.loading = false;

    this.editor = new Editor({
      element: this.shadowRoot?.getElementById('editor-container'),
      extensions: [
        StarterKit.configure({
          heading: false,
          link: {
            openOnClick: false,
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

        Image.configure({
          inline: true,
          resize: {
            enabled: true,
            alwaysPreserveAspectRatio: true,
            minWidth: 50,
            minHeight: 50,
            directions: ['bottom-right'],
          },
        }),

        EditorUpload.configure({
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

    this.editor.on('update', () => {
      this.dispatchEvent(
        new CustomEvent('update', {
          detail: {
            content: cleanHtml(this.editor?.getHTML()),
            characterCount: this.editor?.storage.characterCount.characters(),
          },
        })
      );
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
    this.editor?.commands.setContent('');
  }

  onEmojiSelect(e: CustomEvent) {
    this.editor?.chain().focus().insertContent(e.detail.native).run();
  }

  protected override render() {
    return html`
      ${when(this.loading, () => html`<comment-editor-skeleton></comment-editor-skeleton>`)}
      <div
        class="border rounded-base border-solid border-muted-1 focus-within:border-primary-1 focus-within:shadow-input transition-all"
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
          ${this.renderActionItem({ type: 'separator' })}
          ${this.renderActionItem(uploadActionItem, this.editor)}
          <li class="flex items-center">
            <emoji-button @emoji-select=${this.onEmojiSelect}></emoji-button>
          </li>
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
          <div
            aria-label=${ifDefined(item.displayName?.())}
            title=${ifDefined(item.displayName?.())}
            @click=${() => item.run?.(editor)}
            role="button"
            class="size-7 hover:bg-muted-3 active:bg-muted-2 ${isActive ? 'bg-muted-3 text-text-1' : 'text-text-3 hover:text-text-1'} rounded-base flex items-center justify-center cursor-pointer transition-all"
          >
            <i class="size-5 ${item.icon}" aria-hidden="true"></i>
          </div>
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
