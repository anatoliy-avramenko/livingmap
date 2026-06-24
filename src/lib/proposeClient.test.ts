import { afterEach, describe, expect, it, vi } from "vitest";
import { curatedSignals, initialMapState } from "@/fixtures/acmeMap";
import { buildMapSnapshot, requestProposal } from "./proposeClient";
import type { Signal } from "./types";

const map = buildMapSnapshot(initialMapState);

afterEach(() => {
	vi.restoreAllMocks();
});

describe("requestProposal", () => {
	it("returns live proposal when API succeeds", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue({
			ok: true,
			json: async () => ({
				signalSummary: "summary",
				reasoning: "reasoning",
				operations: [],
			}),
		} as Response);

		const proposal = await requestProposal({
			signal: curatedSignals[0],
			map,
			allowCachedFallback: true,
		});

		expect(proposal.source).toBe("live");
		expect(proposal.signal.id).toBe(curatedSignals[0].id);
	});

	it("uses cached fallback for curated signal when live call fails", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

		const proposal = await requestProposal({
			signal: curatedSignals[0],
			map,
			allowCachedFallback: true,
		});

		expect(proposal.source).toBe("cached");
		expect(proposal.operations.length).toBeGreaterThan(0);
	});

	it("throws when injected signal fails live call", async () => {
		vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

		const injectedSignal: Signal = {
			id: "signal-injected",
			source: "transcript",
			label: "Injected",
			content: "Custom signal",
			occurredAt: "2026-06-24T12:00:00.000Z",
		};

		await expect(
			requestProposal({
				signal: injectedSignal,
				map,
				allowCachedFallback: false,
			}),
		).rejects.toThrow("Live engine unavailable");
	});
});
