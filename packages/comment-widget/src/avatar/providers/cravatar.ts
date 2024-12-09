import AvatarProvider from './avatar-provider';

class Cravatar extends AvatarProvider {
    override getAvatarSrc(emailHash: string | undefined): string {
        return `${this.url}/avatar/${emailHash}`;
    }
}

export default new Cravatar('Cravatar', 'https://cravatar.cn');
