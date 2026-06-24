import type { ReviewableOperation, Task, TaskId } from "@/lib/types";
import { Button } from "./Button";

type OperationCardProps = {
	reviewableOperation: ReviewableOperation;
	tasksById: Record<TaskId, Task>;
	onApprove: () => void;
	onReject: () => void;
};

function decisionLabel(decision: ReviewableOperation["decision"]): string {
	if (decision === "approved") {
		return "Approved";
	}

	if (decision === "rejected") {
		return "Rejected";
	}

	return "Pending";
}

type OperationHeadline = {
	prefix: string;
	target: string;
	suffix?: string;
};

function taskTitle(tasksById: Record<TaskId, Task>, taskId: TaskId): string {
	return tasksById[taskId]?.title ?? "Unknown task";
}

function operationHeadline(
	reviewableOperation: ReviewableOperation,
	tasksById: Record<TaskId, Task>,
): OperationHeadline {
	const operation = reviewableOperation.operation;

	if (operation.type === "CHANGE_TASK_STATUS") {
		return {
			prefix: "Mark",
			target: taskTitle(tasksById, operation.taskId),
			suffix: `as ${operation.newStatus}`,
		};
	}

	if (operation.type === "MOVE_TASK_DATE") {
		return {
			prefix: "Move",
			target: taskTitle(tasksById, operation.taskId),
			suffix: `due date to ${operation.newDueDate}`,
		};
	}

	if (operation.type === "REASSIGN_TASK") {
		return {
			prefix: "Reassign",
			target: taskTitle(tasksById, operation.taskId),
			suffix: `to ${operation.newOwner}`,
		};
	}

	if (operation.type === "ADD_TASK") {
		return {
			prefix: "Add task",
			target: operation.title,
		};
	}

	return {
		prefix: "Add milestone",
		target: operation.title,
	};
}

export function OperationCard({
	reviewableOperation,
	tasksById,
	onApprove,
	onReject,
}: OperationCardProps) {
	const isPending = reviewableOperation.decision === "pending";
	const headline = operationHeadline(reviewableOperation, tasksById);

	return (
		<li className="py-3">
			<div className="mb-2 flex min-w-0 items-center justify-between gap-2">
				<h4 className="min-w-0 break-words font-medium text-slate-900">
					{headline.prefix} <strong>&quot;{headline.target}&quot;</strong>
					{headline.suffix ? ` ${headline.suffix}` : ""}
				</h4>
				<span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
					{decisionLabel(reviewableOperation.decision)}
				</span>
			</div>
			<p className="mb-4 break-words text-xs leading-snug text-slate-700">
				{reviewableOperation.operation.rationale}
			</p>
			<div className="flex gap-2">
				<Button
					variant="approve"
					onClick={onApprove}
					disabled={!isPending}
				>
					Approve
				</Button>
				<Button
					variant="reject"
					onClick={onReject}
					disabled={!isPending}
				>
					Reject
				</Button>
			</div>
		</li>
	);
}
