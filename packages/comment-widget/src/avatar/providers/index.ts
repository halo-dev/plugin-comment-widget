import type AvatarProvider from './avatar-provider';
import Custom from './custom';
import Gravatar from './gravatar';

let avatarProvider: AvatarProvider | undefined;

enum AvatarProviderEnum {
  CUSTOM = 'custom',
  GRAVATAR = 'gravatar',
}

export function setAvatarProvider(provider: string, mirrorUrl?: string) {
  switch (provider) {
    case AvatarProviderEnum.CUSTOM:
      Custom.url = mirrorUrl || '';
      avatarProvider = Custom;
      break;
    case AvatarProviderEnum.GRAVATAR:
      if (mirrorUrl) {
        Gravatar.url = mirrorUrl;
      }
      avatarProvider = Gravatar;
      break;
    default:
  }
}

export function getAvatarProvider() {
  return avatarProvider;
}
