import AvatarProvider from './avatar-provider';

class Weavatar extends AvatarProvider {
    override getAvatarSrc(emailHash: string | undefined): string {
        return `${this.url}/avatar/${emailHash}`;
    }
}

export default new Weavatar('Weavatar', 'https://weavatar.com');
