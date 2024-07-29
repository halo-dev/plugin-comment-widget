import Gravatar from './gravatar';
import Cravatar from './cravatar';
import Weavatar from "./weavatar";
import AvatarProvider from './avatar-provider';

let avatarProvider: AvatarProvider | undefined;

enum AvatarProviderEnum {
  GRAVATAR = 'gravatar',
  CRAVATAR = 'cravatar',
  WEAVATAR = 'weavatar'
}

export function setAvatarProvider(provider: string, mirrorUrl?: string) {
  switch (provider) {
    case AvatarProviderEnum.GRAVATAR:
      if (mirrorUrl) {
        Gravatar.url = mirrorUrl;
      }
      avatarProvider = Gravatar;
      break;
    case AvatarProviderEnum.CRAVATAR:
      if (mirrorUrl) {
        Cravatar.url = mirrorUrl;
      }
      avatarProvider = Cravatar;
      break;
    case AvatarProviderEnum.WEAVATAR:
      if(mirrorUrl){
        Weavatar.url = mirrorUrl;
      }
      avatarProvider = Weavatar;
      break;
    default:
  }
}

export function getAvatarProvider() {
  return avatarProvider;
}
