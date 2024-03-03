import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import './icons/icon-loading';
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { Picker } from 'emoji-mart';
import { consume } from '@lit/context';
import { emojiDataUrlContext } from './context';
import './icons/icon-emoji';
import './icons/icon-loading';
import varStyles from './styles/var';
import baseStyles from './styles/base';

@customElement('emoji-button')
export class EmojiButton extends LitElement {
  @state()
  emojiPickerVisible = false;

  @state()
  emojiLoading = false;

  @state()
  emojiPicker: Picker | null = null;

  @consume({ context: emojiDataUrlContext })
  @state()
  emojiDataUrl = '';

  emojiPickerWrapperRef: Ref<HTMLDivElement> = createRef<HTMLDivElement>();

  constructor() {
    super();
    this.emojiPickerVisible = false;
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleClickOutside, true);
  }

  override disconnectedCallback() {
    document.removeEventListener('click', this.handleClickOutside, true);
    super.disconnectedCallback();
  }

  handleClickOutside(event: Event) {
    if (this.emojiPickerVisible && !event.composedPath().includes(this)) {
      this.emojiPickerVisible = false;
    }
  }

  async handleOpenEmojiPicker() {
    if (this.emojiPickerVisible) {
      this.emojiPickerVisible = false;
      return;
    }

    if (this.emojiPickerWrapperRef.value?.children.length) {
      this.emojiPickerVisible = true;
      return;
    }

    this.emojiLoading = true;

    const response = await fetch(this.emojiDataUrl);
    const data = await response.json();

    const emojiPicker = new Picker({
      data,
      onEmojiSelect: ({ native }: { native: string }) => {
        this.dispatchEvent(new CustomEvent('emoji-select', { detail: { native } }));
      },
      // TODO: support locale
      // locale: zh,
    });

    // TODO: fix this ts error
    this.emojiPickerWrapperRef.value?.appendChild(emojiPicker as unknown as Node);

    this.emojiPickerVisible = true;
    this.emojiLoading = false;
  }

  override render() {
    return html`<button class="emoji-button" type="button">
      ${this.emojiLoading
        ? html`<icon-loading></icon-loading>`
        : html`<icon-emoji @click=${this.handleOpenEmojiPicker}></icon-emoji>`}

      <div
        class="form__emoji-panel"
        style="display: ${this.emojiPickerVisible ? 'block' : 'none'}"
        ${ref(this.emojiPickerWrapperRef)}
      ></div>
    </button>`;
  }

  static override styles = [
    varStyles,
    baseStyles,
    css`
      :host {
        display: inline-flex;
      }

      em-emoji-picker {
        --rgb-color: var(--component-emoji-picker-rgb-color);
        --rgb-accent: var(--component-emoji-picker-rgb-accent);
        --rgb-background: var(--component-emoji-picker-rgb-background);
        --rgb-input: var(--component-emoji-picker-rgb-input);
        --color-border: var(--component-emoji-picker-color-border);
        --color-border-over: var(--component-emoji-picker-color-border-over);
      }

      .emoji-button {
        color: var(--component-form-button-emoji-color);
        display: inline-flex;
        position: relative;
      }

      .emoji-button:hover {
        color: initial;
      }

      .form__emoji-panel {
        position: absolute;
        top: 2rem;
        right: 0;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        border-radius: 0.875rem;
        overflow: hidden;
      }

      @media (max-width: 640px) {
        .form__emoji-panel {
          right: -7.8rem;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'emoji-button': EmojiButton;
  }
}
