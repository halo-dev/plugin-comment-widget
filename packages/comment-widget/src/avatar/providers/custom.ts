import AvatarProvider from './avatar-provider';

const seedPlaceholderPattern = /\{(?:hash|seed)\}/;

class CustomAvatar extends AvatarProvider {
  override getAvatarSrc(emailHash: string | undefined): string {
    const source = this.url.trim();
    const seed = encodeURIComponent(emailHash || 'anonymous');

    if (!source) {
      return '';
    }

    if (seedPlaceholderPattern.test(source)) {
      return source.replace(/\{hash\}/g, seed).replace(/\{seed\}/g, seed);
    }

    return `${source}${source.includes('?') ? '&' : '?'}_avatar=${seed}`;
  }
}

export default new CustomAvatar('Custom', '');
