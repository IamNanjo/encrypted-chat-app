interface Chat {
	keys: string[];
}

export default () => useState<Chat>(() => ref({ keys: [] }));
