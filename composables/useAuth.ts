interface User {
  authenticated: boolean;
}

export interface UnAuthenticatedUser extends User {
  authenticated: false;
}

export interface AuthenticatedUser extends User {
  authenticated: true;
  token: string;
  userId: number;
  username: string;
  currentDevice: number | null;
}

export default () =>
  useState(() =>
    ref({ authenticated: false } as UnAuthenticatedUser | AuthenticatedUser)
  );
