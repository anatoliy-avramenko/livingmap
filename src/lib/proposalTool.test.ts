import { describe, expect, it } from "vitest";
import { sanitizeToolResponse } from "./proposalTool";

const map = {
	milestones: [{ id: "milestone-1", title: "M1", order: 1 }],
	tasks: [
		{
			id: "task-1",
			milestoneId: "milestone-1",
			title: "Task 1",
			owner: "Dana",
			dueDate: "2026-06-24",
			status: "not-started" as const,
		},
	],
};

describe("sanitizeToolResponse", () => {
	it("passes through inferredSource when valid string", () => {
		const result = sanitizeToolResponse(
			{
				signalSummary: "summary",
				reasoning: "reasoning",
				inferredSource: "Document upload",
				operations: [],
			},
			map,
		);

		expect(result.inferredSource).toBe("Document upload");
	});

	it("falls back inferredSource when missing or invalid", () => {
		const missing = sanitizeToolResponse(
			{
				signalSummary: "summary",
				reasoning: "reasoning",
				operations: [],
			},
			map,
		);

		const invalid = sanitizeToolResponse(
			{
				signalSummary: "summary",
				reasoning: "reasoning",
				inferredSource: 123,
				operations: [],
			},
			map,
		);

		expect(missing.inferredSource).toBe("Unclassified");
		expect(invalid.inferredSource).toBe("Unclassified");
	});

	it("drops operations targeting non-existent ids", () => {
		const result = sanitizeToolResponse(
			{
				signalSummary: "summary",
				reasoning: "reasoning",
				operations: [
					{
						id: "op-1",
						type: "CHANGE_TASK_STATUS",
						summary: "bad",
						rationale: "bad",
						basis: "Missing task",
						taskId: "task-missing",
						newStatus: "blocked",
					},
					{
						id: "op-2",
						type: "ADD_TASK",
						summary: "good",
						rationale: "good",
						basis: "New action needed",
						milestoneId: "milestone-1",
						title: "New task",
						owner: "Dana",
						dueDate: "2026-06-30",
						status: "not-started",
					},
				],
			},
			map,
		);

		expect(result.operations).toHaveLength(1);
		expect(result.operations[0].id).toBe("op-2");
		expect(result.operations[0].basis).toBe("New action needed");
	});

	it("returns empty operations when all outputs are invalid", () => {
		const result = sanitizeToolResponse(
			{
				signalSummary: "summary",
				reasoning: "reasoning",
				operations: [
					{
						id: "op-1",
						type: "MOVE_TASK_DATE",
						summary: "bad date",
						rationale: "bad date",
						basis: "Date invalid",
						taskId: "task-1",
						newDueDate: "not-a-date",
					},
				],
			},
			map,
		);

		expect(result.operations).toEqual([]);
		expect(result.signalSummary).toBe("summary");
		expect(result.reasoning).toBe("reasoning");
		expect(result.inferredSource).toBe("Unclassified");
	});

	it("keeps an operation missing basis and falls back to a default", () => {
		const result = sanitizeToolResponse(
			{
				signalSummary: "summary",
				reasoning: "reasoning",
				operations: [
					{
						id: "op-1",
						type: "CHANGE_TASK_STATUS",
						summary: "missing basis",
						rationale: "missing basis",
						taskId: "task-1",
						newStatus: "blocked",
					},
				],
			},
			map,
		);

		expect(result.operations).toHaveLength(1);
		expect(result.operations[0].basis).toBe("AI proposal");
	});
});
