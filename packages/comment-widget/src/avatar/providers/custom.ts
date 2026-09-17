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

    const fragmentIndex = source.indexOf('#');
    const url = fragmentIndex < 0 ? source : source.slice(0, fragmentIndex);
    const fragment = fragmentIndex < 0 ? '' : source.slice(fragmentIndex);
    return `${url}${url.includes('?') ? '&' : '?'}_avatar=${seed}${fragment}`;
  }
}

export default new CustomAvatar('Custom', '');
