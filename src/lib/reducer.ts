import type { MapAction } from "./actions";
import type {
	EventTrigger,
	MapEvent,
	MapState,
	Milestone,
	Operation,
	ReviewableOperation,
	Signal,
	Task,
	TaskId,
} from "./types";

type ApplyOperationContext = {
	triggeredBy: Extract<EventTrigger, "ai" | "manual">;
	mutationId: string;
	signal?: Signal;
	approvedBy?: string;
};

type AppliedOperation = {
	milestones: Milestone[];
	tasksById: Record<TaskId, Task>;
	event: MapEvent;
};

function findReviewableOperation(
	state: MapState,
	operationId: string,
): { reviewableOperation: ReviewableOperation; index: number } | null {
	if (!state.activeProposal) {
		return null;
	}

	const index = state.activeProposal.operations.findIndex(
		(candidate) => candidate.operation.id === operationId,
	);

	if (index === -1) {
		return null;
	}

	return {
		reviewableOperation: state.activeProposal.operations[index],
		index,
	};
}

function updateOperationDecision(
	state: MapState,
	index: number,
	decision: "approved" | "rejected",
): MapState["activeProposal"] {
	if (!state.activeProposal) {
		return null;
	}

	const nextOperations = state.activeProposal.operations.map(
		(reviewableOperation, currentIndex) => {
			if (currentIndex !== index) {
				return reviewableOperation;
			}

			return {
				operation: reviewableOperation.operation,
				decision,
			};
		},
	);

	return {
		...state.activeProposal,
		operations: nextOperations,
	};
}

function makeApprovedEvent(base: Omit<MapEvent, "kind">): MapEvent {
	return {
		...base,
		kind: "operation-approved",
	};
}

function approvalMetadata(
	approvedBy?: string,
): Partial<Pick<MapEvent, "approvedBy">> {
	if (!approvedBy) {
		return {};
	}

	return { approvedBy };
}

function assertUnreachable(value: never): never {
	throw new Error(`Unhandled operation type: ${String(value)}`);
}

function operationDescription(operation: Operation): {
	approved: string;
	declined: string;
} {
	switch (operation.type) {
		case "MOVE_TASK_DATE":
			return {
				approved: `Moved due date to ${operation.newDueDate}`,
				declined: `Declined: move due date to ${operation.newDueDate}`,
			};
		case "CHANGE_TASK_STATUS":
			return {
				approved: `Changed status to ${operation.newStatus}`,
				declined: `Declined: change status to ${operation.newStatus}`,
			};
		case "REASSIGN_TASK":
			return {
				approved: `Reassigned owner to ${operation.newOwner}`,
				declined: `Declined: reassign owner to ${operation.newOwner}`,
			};
		case "ADD_TASK":
			return {
				approved: `Added task: ${operation.title}`,
				declined: `Declined: add task: ${operation.title}`,
			};
		case "ADD_MILESTONE":
			return {
				approved: `Added milestone: ${operation.title}`,
				declined: `Declined: add milestone: ${operation.title}`,
			};
		default:
			return assertUnreachable(operation);
	}
}

function buildEvent(params: {
	operation: Operation;
	context: ApplyOperationContext;
	appliedAt: string;
	eventId: string;
	description: string;
	taskId?: TaskId;
	milestoneId?: string;
}): MapEvent {
	const {
		operation,
		context,
		appliedAt,
		eventId,
		description,
		taskId,
		milestoneId,
	} = params;

	return makeApprovedEvent({
		id: eventId,
		triggeredBy: context.triggeredBy,
		taskId,
		milestoneId,
		signalId: context.signal?.id,
		signalLabel: context.signal?.label,
		operationType: operation.type,
		description,
		basis: operation.basis,
		...approvalMetadata(context.approvedBy),
		createdAt: appliedAt,
	});
}

function isProposalResolved(state: MapState): boolean {
	if (!state.activeProposal) {
		return false;
	}

	return state.activeProposal.operations.every(
		(reviewableOperation) => reviewableOperation.decision !== "pending",
	);
}

function clearResolvedProposal(state: MapState): MapState {
	if (!isProposalResolved(state)) {
		return state;
	}

	return {
		...state,
		activeProposal: null,
	};
}

function sortMilestonesByOrder(milestones: Milestone[]): Milestone[] {
	return [...milestones].sort((left, right) => left.order - right.order);
}

function applyOperation(
	state: MapState,
	operation: Operation,
	appliedAt: string,
	context: ApplyOperationContext,
): AppliedOperation | null {
	const eventId = `event-approved-${context.mutationId}-${operation.id}`;
	const description = operationDescription(operation).approved;

	switch (operation.type) {
		case "MOVE_TASK_DATE": {
			const task = state.tasksById[operation.taskId];
			if (!task) {
				return null;
			}

			const nextTask: Task = {
				...task,
				dueDate: operation.newDueDate,
			};

			return {
				milestones: state.milestones,
				tasksById: {
					...state.tasksById,
					[task.id]: nextTask,
				},
				event: buildEvent({
					operation,
					context,
					appliedAt,
					eventId,
					description,
					taskId: task.id,
					milestoneId: task.milestoneId,
				}),
			};
		}
		case "CHANGE_TASK_STATUS": {
			const task = state.tasksById[operation.taskId];
			if (!task) {
				return null;
			}

			const nextTask: Task = {
				...task,
				status: operation.newStatus,
			};

			return {
				milestones: state.milestones,
				tasksById: {
					...state.tasksById,
					[task.id]: nextTask,
				},
				event: buildEvent({
					operation,
					context,
					appliedAt,
					eventId,
					description,
					taskId: task.id,
					milestoneId: task.milestoneId,
				}),
			};
		}
		case "REASSIGN_TASK": {
			const task = state.tasksById[operation.taskId];
			if (!task) {
				return null;
			}

			const nextTask: Task = {
				...task,
				owner: operation.newOwner,
			};

			return {
				milestones: state.milestones,
				tasksById: {
					...state.tasksById,
					[task.id]: nextTask,
				},
				event: buildEvent({
					operation,
					context,
					appliedAt,
					eventId,
					description,
					taskId: task.id,
					milestoneId: task.milestoneId,
				}),
			};
		}
		case "ADD_TASK": {
			const milestone = state.milestones.find(
				(candidate) => candidate.id === operation.milestoneId,
			);
			if (!milestone) {
				return null;
			}

			const generatedTaskId = `task-${context.mutationId}-${operation.id}`;

			const nextTask: Task = {
				id: generatedTaskId,
				milestoneId: operation.milestoneId,
				title: operation.title,
				owner: operation.owner,
				dueDate: operation.dueDate,
				status: operation.status,
			};

			const nextMilestones = state.milestones.map((candidate) => {
				if (candidate.id !== milestone.id) {
					return candidate;
				}

				return {
					...candidate,
					taskIds: [...candidate.taskIds, generatedTaskId],
				};
			});

			return {
				milestones: nextMilestones,
				tasksById: {
					...state.tasksById,
					[generatedTaskId]: nextTask,
				},
				event: buildEvent({
					operation,
					context,
					appliedAt,
					eventId,
					description,
					taskId: generatedTaskId,
					milestoneId: operation.milestoneId,
				}),
			};
		}
		case "ADD_MILESTONE": {
			const generatedMilestoneId = `milestone-${context.mutationId}-${operation.id}`;

			const nextMilestone: Milestone = {
				id: generatedMilestoneId,
				title: operation.title,
				order: operation.order,
				taskIds: [],
			};

			const nextMilestones = sortMilestonesByOrder([
				...state.milestones,
				nextMilestone,
			]);

			return {
				milestones: nextMilestones,
				tasksById: state.tasksById,
				event: buildEvent({
					operation,
					context,
					appliedAt,
					eventId,
					description,
					milestoneId: generatedMilestoneId,
				}),
			};
		}
		default: {
			return null;
		}
	}
}

export function getMilestoneProgress(
	state: MapState,
	milestoneId: string,
): { done: number; total: number } {
	const milestone = state.milestones.find(
		(candidate) => candidate.id === milestoneId,
	);

	if (!milestone) {
		return { done: 0, total: 0 };
	}

	const total = milestone.taskIds.length;
	const done = milestone.taskIds.reduce((count, taskId) => {
		const task = state.tasksById[taskId];
		if (task?.status === "done") {
			return count + 1;
		}
		return count;
	}, 0);

	return { done, total };
}

export function mapReducer(state: MapState, action: MapAction): MapState {
	switch (action.type) {
		case "ENQUEUE_SIGNAL": {
			return {
				...state,
				signalQueue: [...state.signalQueue, action.signal],
			};
		}
		case "DEQUEUE_SIGNAL": {
			if (state.signalQueue.length === 0) {
				return state;
			}

			return {
				...state,
				signalQueue: state.signalQueue.slice(1),
			};
		}
		case "RECEIVE_PROPOSAL": {
			const nextState: MapState = {
				...state,
				activeProposal: action.proposal,
			};

			return clearResolvedProposal(nextState);
		}
		case "APPROVE_OPERATION": {
			if (!state.activeProposal) {
				return state;
			}

			const match = findReviewableOperation(state, action.operationId);
			if (!match) {
				return state;
			}

			if (match.reviewableOperation.decision !== "pending") {
				return state;
			}

			const appliedOperation = applyOperation(
				state,
				match.reviewableOperation.operation,
				action.approvedAt,
				{
					triggeredBy: "ai",
					mutationId: state.activeProposal.id,
					signal: state.activeProposal.signal,
					approvedBy: "Seller",
				},
			);

			if (!appliedOperation) {
				return state;
			}

			const nextState: MapState = {
				milestones: appliedOperation.milestones,
				tasksById: appliedOperation.tasksById,
				participants: state.participants,
				events: [...state.events, appliedOperation.event],
				activeProposal: updateOperationDecision(state, match.index, "approved"),
				signalQueue: state.signalQueue,
			};

			return clearResolvedProposal(nextState);
		}
		case "REJECT_OPERATION": {
			if (!state.activeProposal) {
				return state;
			}

			const match = findReviewableOperation(state, action.operationId);
			if (!match) {
				return state;
			}

			if (match.reviewableOperation.decision !== "pending") {
				return state;
			}

			const operation = match.reviewableOperation.operation;
			const taskId = "taskId" in operation ? operation.taskId : undefined;
			const milestoneId =
				operation.type === "ADD_TASK" ? operation.milestoneId : undefined;

			const rejectionEvent: MapEvent = {
				id: `event-rejected-${state.activeProposal.id}-${operation.id}`,
				kind: "operation-rejected",
				triggeredBy: "ai",
				taskId,
				milestoneId,
				signalId: state.activeProposal.signal.id,
				signalLabel: state.activeProposal.signal.label,
				operationType: operation.type,
				description: operationDescription(operation).declined,
				basis: operation.basis,
				createdAt: action.rejectedAt,
			};

			const nextState: MapState = {
				...state,
				events: [...state.events, rejectionEvent],
				activeProposal: updateOperationDecision(state, match.index, "rejected"),
			};

			return clearResolvedProposal(nextState);
		}
		case "DISMISS_PROPOSAL": {
			return {
				...state,
				activeProposal: null,
			};
		}
		case "APPLY_MANUAL_OPERATION": {
			const appliedOperation = applyOperation(
				state,
				action.operation,
				action.appliedAt,
				{
					triggeredBy: "manual",
					mutationId: action.mutationId,
				},
			);

			if (!appliedOperation) {
				return state;
			}

			return {
				...state,
				milestones: appliedOperation.milestones,
				tasksById: appliedOperation.tasksById,
				events: [...state.events, appliedOperation.event],
			};
		}
		default: {
			return state;
		}
	}
}
