export interface Chat {
  id: number;
  members: {
    id: number;
    username: string;
    devices: { id: number; key: CryptoKey }[];
  }[];
}

export interface Message {
  id: number;
  content: string;
  created: string;
  chatId: number;
  deviceId: number;
  sender: {
    id: number;
    username: string;
  };
}
