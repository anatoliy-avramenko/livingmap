const ANIMALS = [
	"🦊",
	"🐼",
	"🐨",
	"🦁",
	"🐯",
	"🐵",
	"🐧",
	"🦉",
	"🐸",
	"🐙",
	"🦄",
	"🐬",
] as const;

const COLOR_PALETTE = [
	{ backgroundColor: "#ffe4e6", textColor: "#be123c" },
	{ backgroundColor: "#fef3c7", textColor: "#b45309" },
	{ backgroundColor: "#ecfccb", textColor: "#4d7c0f" },
	{ backgroundColor: "#d1fae5", textColor: "#047857" },
	{ backgroundColor: "#cffafe", textColor: "#0e7490" },
	{ backgroundColor: "#e0f2fe", textColor: "#0369a1" },
	{ backgroundColor: "#e0e7ff", textColor: "#4338ca" },
	{ backgroundColor: "#ede9fe", textColor: "#6d28d9" },
] as const;

function hashOwnerName(ownerName: string): number {
	let hash = 0;

	for (let index = 0; index < ownerName.length; index += 1) {
		hash = (hash * 31 + ownerName.charCodeAt(index)) >>> 0;
	}

	return hash;
}

export function getOwnerAvatar(ownerName: string): {
	animal: string;
	backgroundColor: string;
	textColor: string;
} {
	const hash = hashOwnerName(ownerName.trim().toLowerCase());
	const animal = ANIMALS[hash % ANIMALS.length];
	const color = COLOR_PALETTE[hash % COLOR_PALETTE.length];

	return {
		animal,
		backgroundColor: color.backgroundColor,
		textColor: color.textColor,
	};
}
