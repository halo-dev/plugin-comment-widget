export interface ConfigMapData {
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
    anonymousCommentCaptcha: boolean;
    type: 'ALPHANUMERIC' | 'ARITHMETIC';
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
