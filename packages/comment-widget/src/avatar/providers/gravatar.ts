import AvatarProvider from "./avatar-provider";

class Gravatar extends AvatarProvider {
  override getAvatarSrc(emailHash: string | undefined): string {
    return this.url + emailHash;
  }
}

export default new Gravatar(
  "Gravatar",
  "https://gravatar.com/avatar/"
);