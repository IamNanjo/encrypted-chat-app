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
  chatId: number;
  deviceId: number;
  messageId: string;
  content: string;
  created: string;
  sender: {
    id: number;
    username: string;
  };
}
