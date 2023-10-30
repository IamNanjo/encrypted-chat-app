interface User {
	authenticated: boolean;
	username: string;
}

export default () =>
	useState<User>("chatMenu", () => ({ authenticated: true, username: "Nanjoooooooooooooooo" }));
