interface User {
  authenticated: boolean;
}

export interface UnAuthenticatedUser extends User {
  authenticated: false;
}

export interface AuthenticatedUser extends User {
  authenticated: true;
  userId: number;
  username: string;
  currentDevice: {
    id: number;
    name: string;
    key: CryptoKey;
    lastUsed: string;
  } | null;
}

export default () =>
  useState(() =>
    ref({ authenticated: false } as UnAuthenticatedUser | AuthenticatedUser)
  );
