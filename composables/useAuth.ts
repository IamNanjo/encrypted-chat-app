interface User {
	authenticated: boolean;
	username: string;
}

export default () =>
	useState<User>(() => ref({ authenticated: false, username: "" }));
