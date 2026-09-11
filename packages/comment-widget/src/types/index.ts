export interface ConfigMapData {
  captchaRequired: boolean;
  basic: BasicConfig;
  security: SecurityConfig;
  avatar: AvatarConfig;
  editor?: EditorConfig;
}

interface BasicConfig {
  withReplies: boolean;
  size: number;
  withReplySize: number;
  replySize: number;
  showCommenterDevice?: boolean;
  enablePrivateComment?: boolean;
  showPrivateCommentBadge?: boolean;
}

interface SecurityConfig {
  captcha: {
    enable: boolean;
    audience: 'ALL' | 'ANONYMOUS' | 'ROLES';
    roles?: string[];
    includeAnonymous?: boolean;
    type: 'ALPHANUMERIC' | 'ARITHMETIC' | 'TURNSTILE' | 'ALTCHA';
    altchaDisplay?: 'standard' | 'floating';
    altchaHideLogo?: boolean;
    altchaHideFooter?: boolean;
    turnstileSiteKey?: string;
    ignoreCase: boolean;
    captchaLength: number;
  };
}

interface AvatarConfig {
  provider: 'gravatar';
  enable: boolean;
  providerMirror: string;
  policy: 'anonymousUser' | 'allUser' | 'noAvatarUser';
}

interface EditorConfig {
  enableEmoji?: boolean;
  placeholder?: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId: string;
  timestamp: string;
}
