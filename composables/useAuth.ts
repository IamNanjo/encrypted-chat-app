export interface User {
	authenticated: boolean;
	userId: string;
	username: string;
	currentDevice: {
		id: string;
		name: string;
		key: string;
		created: string;
		lastUsed: string;
	} | null;
}

export default () =>
	useState<User>(() =>
		ref({ authenticated: false, userId: "", username: "", currentDevice: null })
	);
