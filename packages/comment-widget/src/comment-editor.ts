import { msg } from '@lit/localize';
import type { Editor } from '@tiptap/core';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import './emoji-button';
import contentStyles from './styles/content.css?inline';
import './comment-editor-skeleton';
import { consume } from '@lit/context';
import { configMapDataContext } from './context';
import baseStyles from './styles/base';
import type { ConfigMapData } from './types';

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

export class CommentEditor extends LitElement {
  @state()
  editor: Editor | undefined;

  @state()
  loading = true;

  @consume({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

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
          placeholder:
            this.configMapData?.editor?.placeholder || msg('Write a comment'),
        }),

        CodeBlockShiki.configure({
          defaultTheme: 'github-dark',
        }),

        CharacterCount,
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
  }

  override disconnectedCallback(): void {
    this.editor?.destroy();
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
    return html` ${this.loading ? html`<comment-editor-skeleton></comment-editor-skeleton>` : ''}
      <div
        class="border rounded-md border-solid border-muted-1 focus-within:border-primary-1 focus-within:shadow-input transition-all"
        ?hidden=${this.loading}
        @click=${this.setFocus}
      >
        <div
          id="editor-container"
          class="p-4 markdown-body !bg-transparent"
        ></div>
        <ul class="list-none p-2.5 flex gap-1 m-0 items-center overflow-x-auto">
          ${repeat(actionItems, (item) =>
            this.renderActionItem(item, this.editor)
          )}
          ${this.renderActionItem({ type: 'separator' })}
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
            aria-label=${item.displayName?.()}
            title=${item.displayName?.()}
            @click=${() => item.run?.(editor)}
            role="button"
            class="size-7 hover:bg-muted-3 active:bg-muted-2 ${isActive ? 'bg-muted-3 text-text-1' : 'text-text-3 hover:text-text-1'} rounded-md flex items-center justify-center cursor-pointer transition-all"
          >
            <i class="size-5 ${item.icon}"></i>
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
        color: var(--halo-cw-text-3-color, #334155);
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
