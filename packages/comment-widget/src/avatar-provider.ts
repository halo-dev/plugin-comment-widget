import Gravatar from "./avatar/providers/gravatar";
import AvatarProvider from "./avatar/providers/avatar-provider";

let avatarProvider: AvatarProvider | undefined;

enum AvatarProviderEnum {
  GRAVATAR = "Gravatar"
}

export function setAvatarProvider(provider: string, mirrorUrl?: string) {
  switch (provider) {
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