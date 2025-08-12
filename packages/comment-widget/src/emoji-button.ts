import './icons/icon-loading';
import en from '@emoji-mart/data/i18n/en.json';
import es from '@emoji-mart/data/i18n/es.json';
import zh from '@emoji-mart/data/i18n/zh.json';
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift,
} from '@floating-ui/dom';
import { msg } from '@lit/localize';
import type { Picker } from 'emoji-mart';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';
import { createRef, type Ref, ref } from 'lit/directives/ref.js';
import { getLocale } from './locale';
import baseStyles from './styles/base';

const localeMap = {
  'zh-CN': zh,
  'zh-TW': zh,
  en: en,
  es: es,
};

const sharedEmojiPanel = {
  wrapper: null as HTMLDivElement | null,
  picker: null as Picker | null,
  activeButton: null as EmojiButton | null,

  init() {
    if (this.wrapper) return this.wrapper;

    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .form__emoji-panel {
        box-shadow: 0 0.5em 1em rgba(0, 0, 0, 0.1);
        border-radius: 0.875em;
        overflow: hidden;
        display: none;
      }
      
      .form__emoji-panel.visible {
        display: block;
        animation: fadeInUp 0.3s both;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate3d(0, 5%, 0);
        }
        to {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }
      }
      
      em-emoji-picker {
        --rgb-color: var(--halo-cw-emoji-picker-rgb-color, 34, 36, 39);
        --rgb-accent: var(--halo-cw-emoji-picker-rgb-accent, 34, 102, 237);
        --rgb-background: var(--halo-cw-emoji-picker-rgb-background, 255, 255, 255);
        --rgb-input: var(--halo-cw-emoji-picker-rgb-input, 255, 255, 255);
        --color-border: var(--halo-cw-emoji-picker-color-border, rgba(0, 0, 0, .05));
        --color-border-over: var(--halo-cw-emoji-picker-color-border-over, rgba(0, 0, 0, .1));
      }
    `;
    document.head.appendChild(styleElement);

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'form__emoji-panel';
    this.wrapper.style.position = 'absolute';
    this.wrapper.style.zIndex = '9999';
    document.body.appendChild(this.wrapper);

    return this.wrapper;
  },

  show() {
    if (this.wrapper) {
      this.wrapper.classList.add('visible');
    }
  },

  hide() {
    if (this.wrapper) {
      this.wrapper.classList.remove('visible');
    }
  },
};

export class EmojiButton extends LitElement {
  @state()
  emojiPickerVisible = false;

  @state()
  emojiLoading = false;

  buttonRef: Ref<HTMLDivElement> = createRef<HTMLDivElement>();

  cleanupAutoUpdate: (() => void) | null = null;

  placement: Placement = 'bottom';

  constructor() {
    super();
    this.emojiPickerVisible = false;
    this.handleClickOutside = this.handleClickOutside.bind(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleClickOutside, true);
    sharedEmojiPanel.init();
  }

  override disconnectedCallback() {
    document.removeEventListener('click', this.handleClickOutside, true);
    this.cleanupFloating();
    if (sharedEmojiPanel.activeButton === this) {
      sharedEmojiPanel.activeButton = null;
      sharedEmojiPanel.hide();
    }
    super.disconnectedCallback();
  }

  cleanupFloating() {
    if (this.cleanupAutoUpdate) {
      this.cleanupAutoUpdate();
      this.cleanupAutoUpdate = null;
    }
  }

  handleClickOutside(event: Event) {
    if (
      this.emojiPickerVisible &&
      !event.composedPath().includes(this) &&
      sharedEmojiPanel.wrapper &&
      !event.composedPath().includes(sharedEmojiPanel.wrapper)
    ) {
      this.closeEmojiPicker();
    }
  }

  closeEmojiPicker() {
    this.emojiPickerVisible = false;
    this.cleanupFloating();
    sharedEmojiPanel.hide();
    if (sharedEmojiPanel.activeButton === this) {
      sharedEmojiPanel.activeButton = null;
    }
  }

  async handleOpenEmojiPicker(e: Event) {
    e.stopPropagation();
    e.preventDefault();

    if (this.emojiPickerVisible) {
      this.closeEmojiPicker();
      return;
    }

    if (
      sharedEmojiPanel.activeButton &&
      sharedEmojiPanel.activeButton !== this
    ) {
      sharedEmojiPanel.activeButton.closeEmojiPicker();
    }

    sharedEmojiPanel.activeButton = this;

    if (sharedEmojiPanel.wrapper?.children.length) {
      this.emojiPickerVisible = true;
      sharedEmojiPanel.show();
      this.setupFloating();
      return;
    }

    this.emojiLoading = true;

    const { Picker } = await import('emoji-mart');
    const { default: data } = await import('@emoji-mart/data');

    sharedEmojiPanel.picker = new Picker({
      data,
      onEmojiSelect: ({ native }: { native: string }) => {
        const activeButton = sharedEmojiPanel.activeButton;
        if (activeButton) {
          activeButton.dispatchEvent(
            new CustomEvent('emoji-select', { detail: { native } })
          );
          activeButton.closeEmojiPicker();
        }
      },
      i18n: localeMap[getLocale()],
    });

    if (sharedEmojiPanel.wrapper) {
      sharedEmojiPanel.wrapper.appendChild(
        sharedEmojiPanel.picker as unknown as Node
      );
      sharedEmojiPanel.show();
    }

    this.emojiPickerVisible = true;
    this.emojiLoading = false;
    this.setupFloating();
  }

  setupFloating() {
    if (!this.buttonRef.value || !sharedEmojiPanel.wrapper) return;

    this.cleanupFloating();

    this.cleanupAutoUpdate = autoUpdate(
      this.buttonRef.value,
      sharedEmojiPanel.wrapper,
      () => this.updatePosition()
    );

    this.updatePosition();
  }

  async updatePosition() {
    const reference = this.buttonRef.value;
    const floating = sharedEmojiPanel.wrapper;

    if (!reference || !floating) return;

    const { x, y } = await computePosition(reference, floating, {
      placement: this.placement,
      middleware: [
        offset({
          mainAxis: 8,
          crossAxis: 0,
          alignmentAxis: 0,
        }),
        flip(),
        shift({ padding: 8 }),
      ],
    });

    Object.assign(floating.style, {
      left: `${x}px`,
      top: `${y}px`,
    });
  }

  override render() {
    return html`<div
      role="button"
      class="relative size-7 flex items-center justify-center cursor-pointer"
      aria-label=${msg('Select emoticon')}
      ${ref(this.buttonRef)}
    >
      ${
        this.emojiLoading
          ? html`<icon-loading></icon-loading>`
          : html`<div
            class="i-mdi-sticker-emoji size-5 text-text-3 hover:text-text-1"
            @click=${this.handleOpenEmojiPicker}
          ></div>`
      }
    </div>`;
  }

  static override styles = [
    ...baseStyles,
    css`
      :host {
        display: inline-flex;
      }
      @unocss-placeholder;
    `,
  ];
}

customElements.get('emoji-button') ||
  customElements.define('emoji-button', EmojiButton);

declare global {
  interface HTMLElementTagNameMap {
    'emoji-button': EmojiButton;
  }
}
