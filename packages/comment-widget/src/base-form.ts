import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import resetStyles from './styles/reset';
import { Picker } from 'emoji-mart';
import { emojiDataUrlContext } from './context';
import { consume } from '@lit/context';
import { Ref, createRef, ref } from 'lit/directives/ref.js';

@customElement('base-form')
export class BaseForm extends LitElement {
  @consume({ context: emojiDataUrlContext })
  @state()
  emojiDataUrl = 'https://unpkg.com/@emoji-mart/data';

  @state()
  emojiLoading = false;

  @state()
  emojiPicker: Picker | null = null;

  emojiPickerWrapperRef: Ref<HTMLDivElement> = createRef<HTMLDivElement>();

  textareaRef: Ref<HTMLTextAreaElement> = createRef<HTMLTextAreaElement>();

  async handleOpenEmojiPicker() {
    if (this.emojiPickerWrapperRef.value?.children.length) {
      return;
    }

    this.emojiLoading = true;

    const response = await fetch(this.emojiDataUrl);
    const data = await response.json();

    const emojiPicker = new Picker({
      data,
      onEmojiSelect: ({ native }: { native: string }) => {
        if (this.textareaRef.value) {
          this.textareaRef.value.value += native;
          this.textareaRef.value.focus();
        }
      },
    });

    // TODO: fix this ts error
    this.emojiPickerWrapperRef.value?.appendChild(
      emojiPicker as unknown as Node
    );

    this.emojiLoading = false;
  }

  override render() {
    return html`
      <form class="base-form" @submit="${this.onSubmit}">
        <textarea
          class="base-form-editor"
          ${ref(this.textareaRef)}
          placeholder="编写评论"
          rows="4"
          name="content"
          required
        ></textarea>
        <div class="base-form-anonymous-inputs">
          <input name="displayName" type="text" placeholder="昵称" required />
          <input name="email" type="email" placeholder="电子邮件" required />
          <input name="website" type="url" placeholder="网站" />
          <a href="#"> （已有该站点的账号） </a>
        </div>
        <div class="base-form-actions">
          <div ${ref(this.emojiPickerWrapperRef)}></div>
          <button @click=${this.handleOpenEmojiPicker}>Emoji</button>
          <div>
            <button type="submit" class="base-form-submit">提交</button>
          </div>
        </div>
      </form>
    `;
  }

  onSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const event = new CustomEvent('submit', {
      detail: data,
    });
    this.dispatchEvent(event);
  }

  resetForm() {
    const form = this.shadowRoot?.querySelector('form');
    form?.reset();
  }

  static override styles = [
    resetStyles,
    css`
      .base-form {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .base-form-editor {
        height: auto;
      }

      .base-form-anonymous-inputs {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.5rem;
        align-items: center;
      }

      @media (max-width: 640px) {
        .base-form-anonymous-inputs {
          grid-template-columns: 1fr;
        }
      }

      .base-form-anonymous-inputs a {
        font-size: 0.75rem;
        line-height: 1rem;
        color: #4b5563;
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 300ms;
        user-select: none;
      }

      .base-form-anonymous-inputs a:hover {
        color: #111827;
      }

      input,
      textarea {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        background: #fff;
        border: 0.05rem solid #bcc3ce;
        border-radius: 0.3rem;
        color: #3b4351;
        display: block;
        font-size: 0.875rem;
        height: 2.25rem;
        max-width: 100%;
        outline: 0;
        padding: 0.4rem 0.75rem;
        width: 100%;
        transition: background 0.2s, border 0.2s, box-shadow 0.2s, color 0.2s;
      }

      input:focus,
      textarea:focus {
        border-color: #5755d9;
        box-shadow: 0 0 0 0.1rem rgba(87, 85, 217, 0.2);
      }

      .base-form-actions {
        display: flex;
        justify-content: end;
      }

      .base-form-submit {
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    'base-form': BaseForm;
  }
}
