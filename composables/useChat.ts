export type Chat = {
	id: string;
	members: {
		id: string;
		username: string;
		devices: { id: string; key: CryptoKey }[];
	}[];
};

export default () => useState<Chat | null>(() => null);
