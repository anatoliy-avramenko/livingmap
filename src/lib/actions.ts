import type { Operation, OperationId, Proposal, Signal } from "./types";

export type EnqueueSignalAction = {
	type: "ENQUEUE_SIGNAL";
	signal: Signal;
};

export type DequeueSignalAction = {
	type: "DEQUEUE_SIGNAL";
};

export type ReceiveProposalAction = {
	type: "RECEIVE_PROPOSAL";
	proposal: Proposal;
};

export type ApproveOperationAction = {
	type: "APPROVE_OPERATION";
	operationId: OperationId;
	approvedAt: string;
};

export type RejectOperationAction = {
	type: "REJECT_OPERATION";
	operationId: OperationId;
	rejectedAt: string;
};

export type DismissProposalAction = {
	type: "DISMISS_PROPOSAL";
};

export type ApplyManualOperationAction = {
	type: "APPLY_MANUAL_OPERATION";
	operation: Operation;
	appliedAt: string;
	mutationId: string;
};

export type MapAction =
	| EnqueueSignalAction
	| DequeueSignalAction
	| ReceiveProposalAction
	| ApproveOperationAction
	| RejectOperationAction
	| DismissProposalAction
	| ApplyManualOperationAction;
