interface User {
	authenticated: boolean;
	username: string;
}

export default () =>
	useState<User>("auth", () => ({ authenticated: false, username: "" }));
