export interface ConfigMapData {
  basic: BasicConfig;
  security: SecurityConfig;
  avatar: AvatarConfig;
}

interface BasicConfig {
  withReplies: boolean;
  size: number;
  withReplySize: number;
  replySize: number;
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
