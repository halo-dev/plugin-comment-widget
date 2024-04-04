import Gravatar from "./gravatar";

export default abstract class AvatarProvider {
  private readonly _name: string;
  private _url: string;

  constructor(name: string, url: string) {
    this._name = name;
    this._url = url;
  }

  get url(): string {
    return this._url;
  }

  set url(value: string) {
    this._url = value;
  }

  get name(): string {
    return this._name;
  }

  abstract getAvatarSrc(emailHash: string | undefined): string;
}

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
