import { describe, expect, it } from "vitest";
import { getOwnerAvatar } from "./ownerAvatar";

describe("getOwnerAvatar", () => {
	it("returns the same animal and color for the same owner", () => {
		const first = getOwnerAvatar("Dana (AE)");
		const second = getOwnerAvatar("Dana (AE)");

		expect(first).toEqual(second);
	});

	it("spreads different owner names across multiple avatars", () => {
		const owners = [
			"Dana (AE)",
			"Sam (SE)",
			"Priya (Buyer, Security)",
			"Marcus (Champion)",
			"Raj (Procurement)",
			"Lena (VP Engineering)",
			"Avery",
			"Jordan",
			"Taylor",
			"Morgan",
		];

		const uniqueCombinations = new Set(
			owners.map((owner) => {
				const avatar = getOwnerAvatar(owner);
				return `${avatar.animal}|${avatar.backgroundColor}|${avatar.textColor}`;
			}),
		);

		expect(uniqueCombinations.size).toBeGreaterThan(3);
	});
});
