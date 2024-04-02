export interface User {
  authenticated: boolean;
  userId: number;
  username: string;
  currentDevice: {
    id: number;
    name: string;
    key: string;
    lastUsed: string;
  } | null;
}

export default () =>
  useState<User>(() =>
    ref({ authenticated: false, userId: 0, username: "", currentDevice: null })
  );
