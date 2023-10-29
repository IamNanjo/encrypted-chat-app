interface User {
	authenticated: boolean;
	username: string;
}

export default () =>
	useState<User>("chatMenu", () => ({ authenticated: false, username: "" }));
