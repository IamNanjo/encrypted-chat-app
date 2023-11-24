export type Chat = {
	id: string;
	members: {
		id: string;
		username: string;
		devices: { id: string; key: string }[];
	}[];
};

export default () => useState<Chat | null>(() => null);
