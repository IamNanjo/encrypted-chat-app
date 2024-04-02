export type Chat = {
  id: number;
  members: {
    id: number;
    username: string;
    devices: { id: number; key: CryptoKey }[];
  }[];
};

export default () => useState<Chat | null>(() => null);
