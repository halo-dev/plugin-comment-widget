import type { DetailedUser, User } from '@halo-dev/api-client';
import { provide } from '@lit/context';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import {
  AllUserPolicy,
  AnonymousUserPolicy,
  AvatarPolicyEnum,
  NoAvatarUserPolicy,
  setPolicyInstance,
} from './avatar/avatar-policy';
import { setAvatarProvider } from './avatar/providers';
import './comment-form';
import './comment-item';
import './comment-pagination';
import {
  allowAnonymousCommentsContext,
  baseUrlContext,
  configMapDataContext,
  currentUserContext,
  groupContext,
  kindContext,
  nameContext,
  toastContext,
  versionContext,
} from './context';
import { ToastManager } from './lit-toast';
import baseStyles from './styles/base';
import type { ConfigMapData } from './types';
import './comment-list';
import { ofetch } from 'ofetch';
import './comment-editor-skeleton';

export class CommentWidget extends LitElement {
  @provide({ context: baseUrlContext })
  @property({ type: String, attribute: 'base-url' })
  baseUrl = '';

  @provide({ context: kindContext })
  @property({ type: String })
  kind = '';

  @provide({ context: groupContext })
  @property({ type: String })
  group = '';

  @provide({ context: versionContext })
  @property({ type: String })
  version = '';

  @provide({ context: nameContext })
  @property({ type: String })
  name = '';

  @provide({ context: currentUserContext })
  @state()
  currentUser: User | undefined;

  @provide({ context: allowAnonymousCommentsContext })
  @state()
  allowAnonymousComments = false;

  @provide({ context: configMapDataContext })
  @state()
  configMapData: ConfigMapData | undefined;

  @provide({ context: toastContext })
  @state()
  toastManager: ToastManager | undefined;

  @state()
  isInitialized = false;

  override render() {
    return html` <div class="comment-widget w-full">
      ${
        !this.isInitialized
          ? html`<comment-editor-skeleton></comment-editor-skeleton>`
          : html`
            <comment-form></comment-form>
            <comment-list></comment-list>
          `
      }
    </div>`;
  }

  async fetchGlobalInfo() {
    const data = await ofetch(`${this.baseUrl}/actuator/globalinfo`);
    this.allowAnonymousComments = data.allowAnonymousComments;
  }

  async fetchConfigMapData() {
    const data = await ofetch<ConfigMapData>(
      `${this.baseUrl}/apis/api.commentwidget.halo.run/v1alpha1/config`
    );
    this.configMapData = data;
  }

  async fetchCurrentUser() {
    const data = await ofetch<DetailedUser>(
      `${this.baseUrl}/apis/api.console.halo.run/v1alpha1/users/-`
    );
    this.currentUser =
      data.user.metadata.name === 'anonymousUser' ? undefined : data.user;
  }

  initAvatarProvider() {
    if (!this.configMapData?.avatar.enable) {
      return;
    }
    setAvatarProvider(
      this.configMapData.avatar.provider,
      this.configMapData.avatar.providerMirror
    );
  }

  initAvatarPolicy() {
    if (!this.configMapData?.avatar.enable) {
      setPolicyInstance(undefined);
      return;
    }
    switch (this.configMapData.avatar.policy) {
      case AvatarPolicyEnum.ALL_USER_POLICY: {
        setPolicyInstance(new AllUserPolicy());
        break;
      }
      case AvatarPolicyEnum.NO_AVATAR_USER_POLICY: {
        setPolicyInstance(new NoAvatarUserPolicy());
        break;
      }
      default:
        setPolicyInstance(new AnonymousUserPolicy());
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.init();
  }

  async init() {
    this.toastManager = new ToastManager();
    try {
      await this.fetchGlobalInfo();
      await this.fetchConfigMapData();
      await this.fetchCurrentUser();
    } catch (error) {
      if (error instanceof Error) {
        this.toastManager?.show(error.message, 'error');
      }
      return;
    } finally {
      this.isInitialized = true;
    }
    this.initAvatarProvider();
    this.initAvatarPolicy();
  }

  static override styles = [
    ...baseStyles,
    css`
      :host {
        width: 100%;
        display: flex;
        justify-content: center;
      }

      @unocss-placeholder;
    `,
  ];
}

customElements.get('comment-widget') ||
  customElements.define('comment-widget', CommentWidget);

declare global {
  interface HTMLElementTagNameMap {
    'comment-widget': CommentWidget;
  }
}
