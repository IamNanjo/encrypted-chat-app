interface Message {}

interface Chat {
	id: string;
	keys: string[];
	messages: Message[];
}

export default () =>
	useState<Chat>(() => ref({ id: "", keys: [], messages: [] }));
