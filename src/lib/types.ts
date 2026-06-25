export type MilestoneId = string;
export type TaskId = string;
export type MapEventId = string;
export type SignalId = string;
export type ProposalId = string;
export type OperationId = string;

export const TASK_STATUSES = [
	"not-started",
	"in-progress",
	"done",
	"at-risk",
	"blocked",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
	id: TaskId;
	milestoneId: MilestoneId;
	title: string;
	owner: string;
	dueDate: string;
	status: TaskStatus;
}

export interface Participant {
	id: string;
	name: string;
	side: "seller" | "buyer";
}

export interface Milestone {
	id: MilestoneId;
	title: string;
	order: number;
	taskIds: TaskId[];
}

export type SignalSource = string;

export interface Signal {
	id: SignalId;
	source: SignalSource;
	label: string;
	content: string;
	occurredAt: string;
}

interface OperationBase {
	id: OperationId;
	summary: string;
	rationale: string;
	basis: string;
}

export interface AddTaskOperation extends OperationBase {
	type: "ADD_TASK";
	milestoneId: MilestoneId;
	title: string;
	owner: string;
	dueDate: string;
	status: TaskStatus;
}

export interface MoveTaskDateOperation extends OperationBase {
	type: "MOVE_TASK_DATE";
	taskId: TaskId;
	newDueDate: string;
}

export interface ChangeTaskStatusOperation extends OperationBase {
	type: "CHANGE_TASK_STATUS";
	taskId: TaskId;
	newStatus: TaskStatus;
}

export interface ReassignTaskOperation extends OperationBase {
	type: "REASSIGN_TASK";
	taskId: TaskId;
	newOwner: string;
}

export interface AddMilestoneOperation extends OperationBase {
	type: "ADD_MILESTONE";
	title: string;
	order: number;
}

export type Operation =
	| AddTaskOperation
	| MoveTaskDateOperation
	| ChangeTaskStatusOperation
	| ReassignTaskOperation
	| AddMilestoneOperation;

export type OperationType = Operation["type"];
export type OperationDecision = "pending" | "approved" | "rejected";

export interface ReviewableOperation {
	operation: Operation;
	decision: OperationDecision;
}

export interface ProposeResponse {
	signalSummary: string;
	reasoning: string;
	inferredSource?: string;
	operations: Operation[];
}

export interface Proposal {
	id: ProposalId;
	signal: Signal;
	signalSummary: string;
	reasoning: string;
	inferredSource?: string;
	operations: ReviewableOperation[];
	createdAt: string;
	source: "cached" | "live";
}

export type MapEventKind = "operation-approved" | "operation-rejected";
export type EventTrigger = "ai" | "manual";

export interface MapEvent {
	id: MapEventId;
	kind: MapEventKind;
	triggeredBy: EventTrigger;
	taskId?: TaskId;
	milestoneId?: MilestoneId;
	signalId?: SignalId;
	signalLabel?: string;
	operationType?: OperationType;
	description: string;
	basis?: string;
	approvedBy?: string;
	createdAt: string;
}

export interface MapState {
	milestones: Milestone[];
	tasksById: Record<TaskId, Task>;
	participants: Participant[];
	events: MapEvent[];
	activeProposal: Proposal | null;
	signalQueue: Signal[];
}
