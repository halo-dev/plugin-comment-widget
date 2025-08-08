import { msg } from '@lit/localize';
import type { Editor } from '@tiptap/core';
import { css, html, LitElement, type PropertyValues, unsafeCSS } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import './emoji-button';
import { CharacterCount } from '@tiptap/extensions';
import CodeBlockShiki from 'tiptap-extension-code-block-shiki';
import contentStyles from './styles/content.css?inline';

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
    icon: 'i-mingcute-code-line',
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

  protected override firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.createEditor();
  }

  async createEditor() {
    const { Editor } = await import('@tiptap/core');
    const { Placeholder } = await import('@tiptap/extensions');
    const { StarterKit } = await import('@tiptap/starter-kit');

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
          placeholder: msg('Write a comment'),
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
    this.editor?.chain().focus().run();
  }

  reset() {
    this.editor?.commands.setContent('');
  }

  onEmojiSelect(e: CustomEvent) {
    this.editor?.chain().focus().insertContent(e.detail.native).run();
  }

  protected override render() {
    return html` ${this.renderSkeleton()}
      <div
        class="border rounded-md border-solid border-[var(--component-form-input-border-color)] focus-within:border-[var(--component-form-input-border-color-focus)] transition-all"
        ?hidden=${this.loading}
      >
        <div
          id="editor-container"
          class="p-4 markdown-body !bg-transparent"
        ></div>
        <ul class="list-none p-2.5 flex gap-1 m-0 items-center">
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

  private renderSkeleton() {
    return html`<div
      class="border rounded-md border-solid border-gray-200"
      ?hidden=${!this.loading}
    >
      <div class="animate-pulse p-4">
        <div class="h-4 my-1 w-20 bg-gray-200 rounded"></div>
      </div>
      <div class="py-2.5 px-3 flex gap-1 m-0 items-center">
        ${repeat(
          Array(7),
          () => html`
            <div
              role="button"
              class="size-7 flex items-center justify-center cursor-pointer"
            >
              <div class="size-5 animate-pulse bg-gray-200 rounded-md"></div>
            </div>
          `
        )}
      </div>
    </div>`;
  }

  private renderActionItem(item: ActionItem, editor?: Editor) {
    if (item.type === 'separator') {
      return html`<li class="flex items-center" aria-hidden="true">
        <div class="w-1px bg-gray-100 rounded-full h-3"></div>
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
            class="size-7 hover:bg-gray-100 active:bg-gray-200 ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'} rounded-md flex items-center justify-center cursor-pointer"
          >
            <i class="size-5 ${item.icon}"></i>
          </div>
        </li>
      `;
    }

    return;
  }

  static override styles = [
    unsafeCSS(contentStyles),
    css`
      @unocss-placeholder;

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
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }

      .tiptap code br {
        display: block;
      }
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
