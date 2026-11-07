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

// emoji-mart does not ship a Traditional Chinese translation.
const zhTW = {
  search: '搜尋',
  search_no_results_1: '喔不！',
  search_no_results_2: '找不到相關表情',
  pick: '選擇一個表情…',
  add_custom: '新增自訂表情',
  categories: {
    activity: '活動',
    custom: '自訂',
    flags: '旗幟',
    foods: '食物與飲品',
    frequent: '最近使用',
    nature: '動物與自然',
    objects: '物品',
    people: '表情與角色',
    places: '旅行與景點',
    search: '搜尋結果',
    symbols: '符號',
  },
  skins: {
    choose: '選擇預設膚色',
    1: '預設',
    2: '白色',
    3: '偏白',
    4: '中等',
    5: '偏黑',
    6: '黑色',
  },
};

const localeMap = {
  'zh-CN': zh,
  'zh-TW': zhTW,
  en: en,
  es: es,
};

const sharedEmojiPanel = {
  wrapper: null as HTMLDivElement | null,
  picker: null as Picker | null,
  activeButton: null as EmojiButton | null,
  styleElement: null as HTMLStyleElement | null,

  init() {
    if (!this.styleElement) {
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

      @media (prefers-reduced-motion: reduce) {
        .form__emoji-panel.visible {
          animation: none;
        }
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
      this.styleElement = styleElement;
    }
    if (!this.styleElement.isConnected) {
      document.head.appendChild(this.styleElement);
    }

    if (this.wrapper && !this.wrapper.isConnected) {
      // emoji-mart marks the picker as disconnected and stops observing the
      // document, so let the next open create a usable instance.
      this.picker = null;
      this.wrapper.replaceChildren();
    }
    if (!this.wrapper) {
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'form__emoji-panel';
      this.wrapper.style.position = 'absolute';
      this.wrapper.style.zIndex = '9999';
      this.wrapper.style.display = 'none';
    }
    if (!this.wrapper.isConnected) {
      document.body.appendChild(this.wrapper);
    }

    return this.wrapper;
  },

  show() {
    if (this.wrapper) {
      this.wrapper.style.display = 'block';
      this.wrapper.classList.add('visible');
    }
  },

  hide() {
    if (this.wrapper) {
      this.wrapper.classList.remove('visible');
      this.wrapper.style.display = 'none';
    }
  },

  focus() {
    this.wrapper?.firstElementChild?.shadowRoot
      ?.querySelector('input')
      ?.focus();
  },
};

export class EmojiButton extends LitElement {
  @state()
  emojiPickerVisible = false;

  @state()
  emojiLoading = false;

  buttonRef: Ref<HTMLButtonElement> = createRef<HTMLButtonElement>();

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
    document.addEventListener('keydown', this.handleEscape, true);
    sharedEmojiPanel.init();
  }

  override disconnectedCallback() {
    document.removeEventListener('click', this.handleClickOutside, true);
    document.removeEventListener('keydown', this.handleEscape, true);
    this.cleanupFloating();
    if (sharedEmojiPanel.activeButton === this) {
      sharedEmojiPanel.activeButton = null;
      sharedEmojiPanel.hide();
    }
    this.emojiPickerVisible = false;
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

  private handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.emojiPickerVisible) {
      event.preventDefault();
      event.stopPropagation();
      this.closeEmojiPicker();
      this.buttonRef.value?.focus();
    }
  };

  closeEmojiPicker() {
    this.emojiPickerVisible = false;
    this.cleanupFloating();
    sharedEmojiPanel.hide();
    if (sharedEmojiPanel.activeButton === this) {
      sharedEmojiPanel.activeButton = null;
    }
  }

  async handleOpenEmojiPicker(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const focusSearch = e.detail === 0;

    if (this.emojiPickerVisible) {
      this.closeEmojiPicker();
      return;
    }

    sharedEmojiPanel.init();

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
      if (focusSearch) sharedEmojiPanel.focus();
      this.setupFloating();
      return;
    }

    this.emojiLoading = true;

    const { Picker } = await import('emoji-mart');
    const { default: data } = await import('@emoji-mart/data');

    if (!this.isConnected || sharedEmojiPanel.activeButton !== this) {
      this.emojiLoading = false;
      return;
    }

    if (!sharedEmojiPanel.picker) {
      sharedEmojiPanel.picker = new Picker({
        data,
        autoFocus: focusSearch,
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

      sharedEmojiPanel.wrapper?.appendChild(
        sharedEmojiPanel.picker as unknown as Node
      );
    }

    this.emojiPickerVisible = true;
    this.emojiLoading = false;
    sharedEmojiPanel.show();
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
    return html`<button
      type="button"
      class="relative size-7 rounded-base flex items-center justify-center cursor-pointer hover:bg-muted-3"
      aria-label=${msg('Select emoticon')}
      aria-expanded=${this.emojiPickerVisible}
      ?disabled=${this.emojiLoading}
      @click=${this.handleOpenEmojiPicker}
      ${ref(this.buttonRef)}
    >
      ${
        this.emojiLoading
          ? html`<icon-loading></icon-loading>`
          : html`<i
            class="i-mdi-sticker-emoji size-5 text-text-3 hover:text-text-1"
            aria-hidden="true"
          ></i>`
      }
    </button>`;
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
