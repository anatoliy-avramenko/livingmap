let idCounter = 1;

export function makeId(prefix: string): string {
	const id = `${prefix}-${idCounter}`;
	idCounter += 1;
	return id;
}
