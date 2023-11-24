interface User {
	authenticated: boolean;
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
		ref({ authenticated: false, username: "", currentDevice: null })
	);
