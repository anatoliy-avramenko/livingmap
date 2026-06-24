import type Anthropic from "@anthropic-ai/sdk";
import type {
	AddMilestoneOperation,
	AddTaskOperation,
	ChangeTaskStatusOperation,
	Milestone,
	MoveTaskDateOperation,
	Operation,
	ProposeResponse,
	ReassignTaskOperation,
	Task,
	TaskStatus,
} from "./types";

const VALID_STATUSES: TaskStatus[] = [
	"not-started",
	"in-progress",
	"done",
	"at-risk",
	"blocked",
];

const VALID_OPERATION_TYPES: Operation["type"][] = [
	"ADD_TASK",
	"MOVE_TASK_DATE",
	"CHANGE_TASK_STATUS",
	"REASSIGN_TASK",
	"ADD_MILESTONE",
];

export const PROPOSAL_TOOL_NAME = "propose_map_changes";

export const proposalTool: Anthropic.Messages.Tool = {
	name: PROPOSAL_TOOL_NAME,
	description: "Propose minimal MAP changes justified by the signal.",
	input_schema: {
		type: "object",
		additionalProperties: false,
		properties: {
			signalSummary: { type: "string" },
			reasoning: { type: "string" },
			inferredSource: { type: "string" },
			operations: {
				type: "array",
				items: {
					oneOf: [
						{
							type: "object",
							additionalProperties: false,
							properties: {
								id: { type: "string" },
								type: { type: "string", const: "ADD_TASK" },
								summary: { type: "string" },
								rationale: { type: "string" },
								basis: { type: "string" },
								milestoneId: { type: "string" },
								title: { type: "string" },
								owner: { type: "string" },
								dueDate: { type: "string" },
								status: { type: "string", enum: VALID_STATUSES },
							},
							required: [
								"id",
								"type",
								"summary",
								"rationale",
								"basis",
								"milestoneId",
								"title",
								"owner",
								"dueDate",
								"status",
							],
						},
						{
							type: "object",
							additionalProperties: false,
							properties: {
								id: { type: "string" },
								type: { type: "string", const: "MOVE_TASK_DATE" },
								summary: { type: "string" },
								rationale: { type: "string" },
								basis: { type: "string" },
								taskId: { type: "string" },
								newDueDate: { type: "string" },
							},
							required: [
								"id",
								"type",
								"summary",
								"rationale",
								"basis",
								"taskId",
								"newDueDate",
							],
						},
						{
							type: "object",
							additionalProperties: false,
							properties: {
								id: { type: "string" },
								type: { type: "string", const: "CHANGE_TASK_STATUS" },
								summary: { type: "string" },
								rationale: { type: "string" },
								basis: { type: "string" },
								taskId: { type: "string" },
								newStatus: { type: "string", enum: VALID_STATUSES },
							},
							required: [
								"id",
								"type",
								"summary",
								"rationale",
								"basis",
								"taskId",
								"newStatus",
							],
						},
						{
							type: "object",
							additionalProperties: false,
							properties: {
								id: { type: "string" },
								type: { type: "string", const: "REASSIGN_TASK" },
								summary: { type: "string" },
								rationale: { type: "string" },
								basis: { type: "string" },
								taskId: { type: "string" },
								newOwner: { type: "string" },
							},
							required: [
								"id",
								"type",
								"summary",
								"rationale",
								"basis",
								"taskId",
								"newOwner",
							],
						},
						{
							type: "object",
							additionalProperties: false,
							properties: {
								id: { type: "string" },
								type: { type: "string", const: "ADD_MILESTONE" },
								summary: { type: "string" },
								rationale: { type: "string" },
								basis: { type: "string" },
								title: { type: "string" },
								order: { type: "number" },
							},
							required: [
								"id",
								"type",
								"summary",
								"rationale",
								"basis",
								"title",
								"order",
							],
						},
					],
				},
			},
		},
		required: ["signalSummary", "reasoning", "inferredSource", "operations"],
	},
};

type MapSnapshot = {
	milestones: Array<Pick<Milestone, "id" | "title" | "order">>;
	tasks: Array<
		Pick<Task, "id" | "milestoneId" | "title" | "owner" | "dueDate" | "status">
	>;
};

function isString(value: unknown): value is string {
	return typeof value === "string";
}

function isValidDate(value: unknown): value is string {
	return isString(value) && !Number.isNaN(Date.parse(value));
}

function isValidStatus(value: unknown): value is TaskStatus {
	return isString(value) && VALID_STATUSES.includes(value as TaskStatus);
}

function isOperationBase(value: unknown): value is {
	id: string;
	summary: string;
	rationale: string;
	type: string;
} {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Record<string, unknown>;
	return (
		isString(candidate.id) &&
		isString(candidate.summary) &&
		isString(candidate.rationale) &&
		isString(candidate.type) &&
		VALID_OPERATION_TYPES.includes(candidate.type as Operation["type"])
	);
}

function sanitizeOperation(value: unknown, map: MapSnapshot): Operation | null {
	if (!isOperationBase(value)) {
		return null;
	}

	const candidate = value as {
		id: string;
		summary: string;
		rationale: string;
		type: Operation["type"];
	} & Record<string, unknown>;

	// basis is a short UI caption, not structural: if the model omits it, keep the
	// operation and fall back rather than silently dropping a real plan change.
	const basis =
		isString(candidate.basis) && candidate.basis.trim()
			? candidate.basis
			: "AI proposal";

	switch (candidate.type) {
		case "MOVE_TASK_DATE": {
			if (!isString(candidate.taskId) || !isValidDate(candidate.newDueDate)) {
				return null;
			}

			const hasTask = map.tasks.some((task) => task.id === candidate.taskId);
			if (!hasTask) {
				return null;
			}

			const operation: MoveTaskDateOperation = {
				id: candidate.id,
				type: "MOVE_TASK_DATE",
				summary: candidate.summary,
				rationale: candidate.rationale,
				basis,
				taskId: candidate.taskId,
				newDueDate: candidate.newDueDate,
			};
			return operation;
		}
		case "CHANGE_TASK_STATUS": {
			if (!isString(candidate.taskId) || !isValidStatus(candidate.newStatus)) {
				return null;
			}

			const hasTask = map.tasks.some((task) => task.id === candidate.taskId);
			if (!hasTask) {
				return null;
			}

			const operation: ChangeTaskStatusOperation = {
				id: candidate.id,
				type: "CHANGE_TASK_STATUS",
				summary: candidate.summary,
				rationale: candidate.rationale,
				basis,
				taskId: candidate.taskId,
				newStatus: candidate.newStatus,
			};
			return operation;
		}
		case "REASSIGN_TASK": {
			if (!isString(candidate.taskId) || !isString(candidate.newOwner)) {
				return null;
			}

			const hasTask = map.tasks.some((task) => task.id === candidate.taskId);
			if (!hasTask) {
				return null;
			}

			const operation: ReassignTaskOperation = {
				id: candidate.id,
				type: "REASSIGN_TASK",
				summary: candidate.summary,
				rationale: candidate.rationale,
				basis,
				taskId: candidate.taskId,
				newOwner: candidate.newOwner,
			};
			return operation;
		}
		case "ADD_TASK": {
			if (
				!isString(candidate.milestoneId) ||
				!isString(candidate.title) ||
				!isString(candidate.owner) ||
				!isValidDate(candidate.dueDate) ||
				!isValidStatus(candidate.status)
			) {
				return null;
			}

			const hasMilestone = map.milestones.some(
				(milestone) => milestone.id === candidate.milestoneId,
			);
			if (!hasMilestone) {
				return null;
			}

			const operation: AddTaskOperation = {
				id: candidate.id,
				type: "ADD_TASK",
				summary: candidate.summary,
				rationale: candidate.rationale,
				basis,
				milestoneId: candidate.milestoneId,
				title: candidate.title,
				owner: candidate.owner,
				dueDate: candidate.dueDate,
				status: candidate.status,
			};
			return operation;
		}
		case "ADD_MILESTONE": {
			if (
				!isString(candidate.title) ||
				typeof candidate.order !== "number" ||
				Number.isNaN(candidate.order)
			) {
				return null;
			}

			const operation: AddMilestoneOperation = {
				id: candidate.id,
				type: "ADD_MILESTONE",
				summary: candidate.summary,
				rationale: candidate.rationale,
				basis,
				title: candidate.title,
				order: candidate.order,
			};
			return operation;
		}
		default:
			return null;
	}
}

export function sanitizeToolResponse(
	value: unknown,
	map: MapSnapshot,
): ProposeResponse {
	const candidate =
		value && typeof value === "object"
			? (value as Record<string, unknown>)
			: {};

	const signalSummary = isString(candidate.signalSummary)
		? candidate.signalSummary
		: "Unable to summarize signal.";

	const reasoning = isString(candidate.reasoning)
		? candidate.reasoning
		: "No reasoning was provided by the model.";

	const inferredSource = isString(candidate.inferredSource)
		? candidate.inferredSource
		: "Unclassified";

	const rawOperations = Array.isArray(candidate.operations)
		? candidate.operations
		: [];
	const operations = rawOperations
		.map((operation) => sanitizeOperation(operation, map))
		.filter((operation): operation is Operation => operation !== null);

	return {
		signalSummary,
		reasoning,
		inferredSource,
		operations,
	};
}
