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
    currentDevice: number | null;
}

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

export interface Device {
    id: number;
    name: string;
    lastUsed: string;
}
