import { DetailedUser } from '@halo-dev/api-client';
import { createContext } from '@lit/context';

export const baseUrlContext = createContext<string>(Symbol('baseUrl'));
export const kindContext = createContext<string>(Symbol('kind'));
export const groupContext = createContext<string>(Symbol('group'));
export const nameContext = createContext<string>(Symbol('name'));
export const versionContext = createContext<string>(Symbol('version'));

export const allowAnonymousCommentsContext = createContext<boolean>(
  Symbol('allowAnonymousComments')
);

export const currentUserContext = createContext<DetailedUser | undefined>(
  Symbol('currentUser')
);

export const emojiDataUrlContext = createContext<string>(
  Symbol('emojiDataUrl')
);
