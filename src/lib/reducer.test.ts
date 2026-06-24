import { describe, expect, it } from "vitest";
import { initialMapState, TODAY } from "../fixtures/acmeMap";
import { getMilestoneProgress, mapReducer } from "./reducer";
import type { MapState, Operation, Proposal, Signal } from "./types";

const testSignal: Signal = {
	id: "signal-test",
	source: "transcript",
	label: "Test signal",
	content: "Test content",
	occurredAt: `${TODAY}T13:00:00.000Z`,
};

function buildProposal(operations: Operation[]): Proposal {
	return {
		id: "proposal-test",
		signal: testSignal,
		signalSummary: "Test signal summary",
		reasoning: "Test reasoning",
		operations: operations.map((operation) => ({
			operation,
			decision: "pending",
		})),
		createdAt: `${TODAY}T13:01:00.000Z`,
		source: "cached",
	};
}

function buildStateWithProposal(operations: Operation[]): MapState {
	return {
		...structuredClone(initialMapState),
		activeProposal: buildProposal(operations),
	};
}

describe("mapReducer", () => {
	it("starts with empty event history in initial state", () => {
		expect(initialMapState.events).toEqual([]);
	});

	it("seeds a participant roster and keeps every seeded task owner in that roster", () => {
		const participantNames = new Set(
			initialMapState.participants.map((participant) => participant.name),
		);

		expect(initialMapState.participants.length).toBeGreaterThan(0);
		expect(Object.values(initialMapState.tasksById)).not.toHaveLength(0);

		for (const task of Object.values(initialMapState.tasksById)) {
			expect(participantNames.has(task.owner)).toBe(true);
		}
	});

	it("approves MOVE_TASK_DATE and appends exactly one event", () => {
		const operation: Operation = {
			id: "op-move-date",
			type: "MOVE_TASK_DATE",
			summary: "Move benchmark due date",
			rationale: "Need more time",
			basis: "Benchmark window shifted",
			taskId: "task-performance-benchmark-signoff",
			newDueDate: "2026-06-29",
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:00:00.000Z`,
		});

		expect(nextState.tasksById[operation.taskId].dueDate).toBe("2026-06-29");
		expect(nextState.events).toHaveLength(state.events.length + 1);
		expect(nextState.events.at(-1)?.kind).toBe("operation-approved");
		expect(nextState.events.at(-1)?.triggeredBy).toBe("ai");
		expect(nextState.events.at(-1)?.operationType).toBe("MOVE_TASK_DATE");
		expect(nextState.events.at(-1)?.approvedBy).toBe("Seller");
		expect(nextState.events.at(-1)?.basis).toBe("Benchmark window shifted");
		expect(nextState.activeProposal).toBeNull();
	});

	it("approves CHANGE_TASK_STATUS and appends exactly one event", () => {
		const operation: Operation = {
			id: "op-change-status",
			type: "CHANGE_TASK_STATUS",
			summary: "Set security to blocked",
			rationale: "Security requested SOC2 deep-dive",
			basis: "SOC2 session required",
			taskId: "task-security-compliance-review",
			newStatus: "blocked",
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:01:00.000Z`,
		});

		expect(nextState.tasksById[operation.taskId].status).toBe("blocked");
		expect(nextState.events).toHaveLength(state.events.length + 1);
		expect(nextState.events.at(-1)?.operationType).toBe("CHANGE_TASK_STATUS");
		expect(nextState.activeProposal).toBeNull();
	});

	it("approves REASSIGN_TASK and appends exactly one event", () => {
		const operation: Operation = {
			id: "op-reassign",
			type: "REASSIGN_TASK",
			summary: "Reassign integration task",
			rationale: "VP Engineering owns sign-off now",
			basis: "New executive owner",
			taskId: "task-integration-poc-acme-data",
			newOwner: "Lena (VP Engineering)",
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:02:00.000Z`,
		});

		expect(nextState.tasksById[operation.taskId].owner).toBe(
			"Lena (VP Engineering)",
		);
		expect(nextState.events).toHaveLength(state.events.length + 1);
		expect(nextState.events.at(-1)?.operationType).toBe("REASSIGN_TASK");
		expect(nextState.activeProposal).toBeNull();
	});

	it("approves ADD_TASK and appends exactly one event", () => {
		const operation: Operation = {
			id: "op-add-task",
			type: "ADD_TASK",
			summary: "Add legal review task",
			rationale: "Legal review needed before close",
			basis: "Legal gate added",
			milestoneId: "milestone-commercials",
			title: "Schedule legal review meeting",
			owner: "Dana (AE)",
			dueDate: "2026-06-27",
			status: "not-started",
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:03:00.000Z`,
		});

		const createdTaskId = "task-proposal-test-op-add-task";
		expect(nextState.tasksById[createdTaskId]).toMatchObject({
			title: "Schedule legal review meeting",
			milestoneId: "milestone-commercials",
		});
		expect(
			nextState.milestones
				.find((milestone) => milestone.id === "milestone-commercials")
				?.taskIds.includes(createdTaskId),
		).toBe(true);
		expect(nextState.events).toHaveLength(state.events.length + 1);
		expect(nextState.events.at(-1)?.taskId).toBe(createdTaskId);
		expect(nextState.activeProposal).toBeNull();
	});

	it("approves ADD_MILESTONE and appends exactly one event", () => {
		const operation: Operation = {
			id: "op-add-milestone",
			type: "ADD_MILESTONE",
			summary: "Add executive alignment milestone",
			rationale: "Need dedicated phase for exec sign-off",
			basis: "Executive review phase needed",
			title: "Executive Alignment",
			order: 3,
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:04:00.000Z`,
		});

		const createdMilestoneId = "milestone-proposal-test-op-add-milestone";
		expect(
			nextState.milestones.some(
				(milestone) => milestone.id === createdMilestoneId,
			),
		).toBe(true);
		expect(nextState.events).toHaveLength(state.events.length + 1);
		expect(nextState.events.at(-1)?.milestoneId).toBe(createdMilestoneId);
		expect(nextState.activeProposal).toBeNull();
	});

	it("rejects operation, appends rejection event, and leaves primary state unchanged", () => {
		const operation: Operation = {
			id: "op-reject",
			type: "CHANGE_TASK_STATUS",
			summary: "Set pricing to at-risk",
			rationale: "No engagement in six days",
			basis: "No recent buyer activity",
			taskId: "task-pricing-proposal-delivered",
			newStatus: "at-risk",
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "REJECT_OPERATION",
			operationId: operation.id,
			rejectedAt: `${TODAY}T14:05:00.000Z`,
		});

		expect(nextState.tasksById).toEqual(state.tasksById);
		expect(nextState.milestones).toEqual(state.milestones);
		expect(nextState.events).toHaveLength(state.events.length + 1);
		expect(nextState.events.at(-1)?.kind).toBe("operation-rejected");
		expect(nextState.events.at(-1)?.triggeredBy).toBe("ai");
		expect(nextState.events.at(-1)?.description).toBe(
			"Declined: change status to at-risk",
		);
		expect(nextState.events.at(-1)?.basis).toBe("No recent buyer activity");
		expect(nextState.activeProposal).toBeNull();
	});

	it("rejecting ADD_TASK includes milestone scope", () => {
		const operation: Operation = {
			id: "op-reject-add-task",
			type: "ADD_TASK",
			summary: "Add procurement legal sync",
			rationale: "Legal wants dedicated sync",
			basis: "Legal stakeholder requested sync",
			milestoneId: "milestone-commercials",
			title: "Schedule procurement legal sync",
			owner: "Dana (AE)",
			dueDate: "2026-07-01",
			status: "not-started",
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "REJECT_OPERATION",
			operationId: operation.id,
			rejectedAt: `${TODAY}T14:05:00.000Z`,
		});

		expect(nextState.events.at(-1)).toMatchObject({
			kind: "operation-rejected",
			triggeredBy: "ai",
			operationType: "ADD_TASK",
			milestoneId: "milestone-commercials",
			taskId: undefined,
		});
		expect(nextState.events.at(-1)?.description).toBe(
			"Declined: add task: Schedule procurement legal sync",
		);
	});

	it("rejecting ADD_MILESTONE remains unscoped from milestones/tasks", () => {
		const operation: Operation = {
			id: "op-reject-add-milestone",
			type: "ADD_MILESTONE",
			summary: "Add legal alignment milestone",
			rationale: "Buyer added legal committee",
			basis: "Legal committee now involved",
			title: "Legal Alignment",
			order: 4,
		};
		const state = buildStateWithProposal([operation]);

		const nextState = mapReducer(state, {
			type: "REJECT_OPERATION",
			operationId: operation.id,
			rejectedAt: `${TODAY}T14:05:00.000Z`,
		});

		expect(nextState.events.at(-1)).toMatchObject({
			kind: "operation-rejected",
			triggeredBy: "ai",
			operationType: "ADD_MILESTONE",
			milestoneId: undefined,
			taskId: undefined,
		});
	});

	it("derives milestone progress from tasksById", () => {
		const state = structuredClone(initialMapState);

		const discoveryProgress = getMilestoneProgress(
			state,
			"milestone-discovery-alignment",
		);
		const technicalProgress = getMilestoneProgress(
			state,
			"milestone-technical-validation",
		);

		expect(discoveryProgress).toEqual({ done: 2, total: 3 });
		expect(technicalProgress).toEqual({ done: 0, total: 3 });
	});

	it("current state is independent of the event log", () => {
		const state = structuredClone(initialMapState);
		const corruptedEventState: MapState = {
			...state,
			events: [
				{
					id: "event-bogus",
					kind: "operation-approved",
					triggeredBy: "ai",
					taskId: "task-pricing-proposal-delivered",
					operationType: "CHANGE_TASK_STATUS",
					description: "Bogus event that should not affect current state",
					createdAt: `${TODAY}T16:00:00.000Z`,
				},
			],
		};

		expect(corruptedEventState.tasksById).toEqual(state.tasksById);
		expect(corruptedEventState.milestones).toEqual(state.milestones);
		expect(
			getMilestoneProgress(
				corruptedEventState,
				"milestone-technical-validation",
			),
		).toEqual(getMilestoneProgress(state, "milestone-technical-validation"));
	});

	it("is idempotent when approving the same operation twice", () => {
		const operation: Operation = {
			id: "op-idempotent-approve",
			type: "MOVE_TASK_DATE",
			summary: "Move pricing due date",
			rationale: "Waiting for budget clarification",
			basis: "Budget timing unclear",
			taskId: "task-pricing-proposal-delivered",
			newDueDate: "2026-07-05",
		};
		const state = buildStateWithProposal([operation]);

		const approvedOnce = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:06:00.000Z`,
		});

		const approvedTwice = mapReducer(approvedOnce, {
			type: "APPROVE_OPERATION",
			operationId: operation.id,
			approvedAt: `${TODAY}T14:07:00.000Z`,
		});

		expect(approvedTwice.events).toHaveLength(approvedOnce.events.length);
		expect(approvedTwice.activeProposal).toBeNull();
	});

	it("is idempotent when rejecting the same operation twice", () => {
		const operation: Operation = {
			id: "op-idempotent-reject",
			type: "CHANGE_TASK_STATUS",
			summary: "Set procurement to blocked",
			rationale: "Procurement asked to pause",
			basis: "Procurement requested pause",
			taskId: "task-procurement-vendor-onboarding",
			newStatus: "blocked",
		};
		const state = buildStateWithProposal([operation]);

		const rejectedOnce = mapReducer(state, {
			type: "REJECT_OPERATION",
			operationId: operation.id,
			rejectedAt: `${TODAY}T14:08:00.000Z`,
		});

		const rejectedTwice = mapReducer(rejectedOnce, {
			type: "REJECT_OPERATION",
			operationId: operation.id,
			rejectedAt: `${TODAY}T14:09:00.000Z`,
		});

		expect(rejectedTwice.events).toHaveLength(rejectedOnce.events.length);
		expect(rejectedTwice.activeProposal).toBeNull();
	});

	it("enqueues raw signals in FIFO order", () => {
		const state = structuredClone(initialMapState);

		const first = {
			...testSignal,
			id: "signal-1",
			label: "Signal one",
		};
		const second = {
			...testSignal,
			id: "signal-2",
			label: "Signal two",
		};

		const withFirst = mapReducer(state, {
			type: "ENQUEUE_SIGNAL",
			signal: first,
		});
		const withSecond = mapReducer(withFirst, {
			type: "ENQUEUE_SIGNAL",
			signal: second,
		});

		expect(withSecond.signalQueue).toEqual([first, second]);
		expect(withSecond.activeProposal).toBeNull();
	});

	it("dequeue removes the queue front only", () => {
		const state = mapReducer(
			mapReducer(structuredClone(initialMapState), {
				type: "ENQUEUE_SIGNAL",
				signal: { ...testSignal, id: "signal-1" },
			}),
			{
				type: "ENQUEUE_SIGNAL",
				signal: { ...testSignal, id: "signal-2" },
			},
		);

		const nextState = mapReducer(state, { type: "DEQUEUE_SIGNAL" });

		expect(nextState.signalQueue).toHaveLength(1);
		expect(nextState.signalQueue[0].id).toBe("signal-2");
	});

	it("keeps proposal active until all operations are decided", () => {
		const first: Operation = {
			id: "op-1",
			type: "MOVE_TASK_DATE",
			summary: "Move due date",
			rationale: "Need more time",
			basis: "Timeline slipped",
			taskId: "task-pricing-proposal-delivered",
			newDueDate: "2026-07-12",
		};
		const second: Operation = {
			id: "op-2",
			type: "CHANGE_TASK_STATUS",
			summary: "Set at risk",
			rationale: "Delay detected",
			basis: "Delay detected",
			taskId: "task-pricing-proposal-delivered",
			newStatus: "at-risk",
		};

		const state = buildStateWithProposal([first, second]);
		const partiallyReviewed = mapReducer(state, {
			type: "APPROVE_OPERATION",
			operationId: "op-1",
			approvedAt: `${TODAY}T14:06:00.000Z`,
		});

		expect(partiallyReviewed.activeProposal).not.toBeNull();

		const resolved = mapReducer(partiallyReviewed, {
			type: "REJECT_OPERATION",
			operationId: "op-2",
			rejectedAt: `${TODAY}T14:07:00.000Z`,
		});

		expect(resolved.activeProposal).toBeNull();
	});

	it("dismiss proposal frees active slot", () => {
		const state = buildStateWithProposal([
			{
				id: "op-1",
				type: "CHANGE_TASK_STATUS",
				summary: "Set blocked",
				rationale: "Waiting on buyer",
				basis: "Waiting on buyer",
				taskId: "task-security-compliance-review",
				newStatus: "blocked",
			},
		]);

		const nextState = mapReducer(state, { type: "DISMISS_PROPOSAL" });
		expect(nextState.activeProposal).toBeNull();
	});

	it("applies manual operation and writes paired manual MapEvent", () => {
		const state = structuredClone(initialMapState);
		const nextState = mapReducer(state, {
			type: "APPLY_MANUAL_OPERATION",
			operation: {
				id: "op-manual-status",
				type: "CHANGE_TASK_STATUS",
				summary: "Manual status update",
				rationale: "Seller call update",
				basis: "Manual change",
				taskId: "task-security-compliance-review",
				newStatus: "blocked",
			},
			appliedAt: `${TODAY}T14:10:00.000Z`,
			mutationId: "manual-1",
		});

		expect(nextState.tasksById["task-security-compliance-review"].status).toBe(
			"blocked",
		);
		expect(nextState.events.at(-1)).toMatchObject({
			kind: "operation-approved",
			triggeredBy: "manual",
			signalId: undefined,
			operationType: "CHANGE_TASK_STATUS",
		});
		expect(nextState.events.at(-1)?.approvedBy).toBeUndefined();
		expect(nextState.events.at(-1)?.basis).toBe("Manual change");
		expect(nextState.activeProposal).toBeNull();
	});

	it("manual operation does not require active proposal", () => {
		const state = structuredClone(initialMapState);
		const nextState = mapReducer(state, {
			type: "APPLY_MANUAL_OPERATION",
			operation: {
				id: "op-manual-reassign",
				type: "REASSIGN_TASK",
				summary: "Manual owner update",
				rationale: "Seller reassigned directly",
				basis: "Manual change",
				taskId: "task-integration-poc-acme-data",
				newOwner: "Dana (AE)",
			},
			appliedAt: `${TODAY}T14:11:00.000Z`,
			mutationId: "manual-2",
		});

		expect(nextState.tasksById["task-integration-poc-acme-data"].owner).toBe(
			"Dana (AE)",
		);
		expect(nextState.events).toHaveLength(state.events.length + 1);
	});
});
