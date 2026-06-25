import type { Dispatch } from "react";
import { useEffect, useMemo, useState } from "react";
import type { MapAction } from "@/lib/actions";
import { makeId } from "@/lib/ids";
import {
	TASK_STATUSES,
	type MapEvent,
	type Operation,
	type Participant,
	type Task,
} from "@/lib/types";
import { Button } from "./Button";
import { OwnerBadge } from "./OwnerBadge";
import { statusStyles } from "./StatusBadge";
import { TaskHistory } from "./TaskHistory";

type TaskRowProps = {
	task: Task;
	events: MapEvent[];
	participants: Participant[];
	dispatch: Dispatch<MapAction>;
};

const RISK_ROW_CLASS: Partial<Record<Task["status"], string>> = {
	"at-risk": "border-l-2 border-l-amber-400 pl-3",
	blocked: "border-l-2 border-l-rose-400 pl-3",
};

export function TaskRow({
	task,
	events,
	participants,
	dispatch,
}: TaskRowProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [ownerDraft, setOwnerDraft] = useState(task.owner);
	const [dueDateDraft, setDueDateDraft] = useState(task.dueDate.slice(0, 10));
	const [statusDraft, setStatusDraft] = useState(task.status);

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		setOwnerDraft(task.owner);
		setDueDateDraft(task.dueDate.slice(0, 10));
		setStatusDraft(task.status);
	}, [task.owner, task.dueDate, task.status]);
	/* eslint-enable react-hooks/set-state-in-effect */

	const taskEvents = useMemo(
		() =>
			events
				.filter((event) => event.taskId === task.id)
				.slice()
				.sort(
					(left, right) =>
						Date.parse(right.createdAt) - Date.parse(left.createdAt),
				),
		[events, task.id],
	);

	const sellerParticipants = participants.filter(
		(participant) => participant.side === "seller",
	);
	const buyerParticipants = participants.filter(
		(participant) => participant.side === "buyer",
	);

	function dispatchManualOperation(operation: Operation) {
		dispatch({
			type: "APPLY_MANUAL_OPERATION",
			operation,
			appliedAt: new Date().toISOString(),
			mutationId: makeId("manual"),
		});
	}

	function commitDueDate(value: string = dueDateDraft) {
		const normalizedDueDate = value.trim();
		if (!normalizedDueDate || normalizedDueDate === task.dueDate.slice(0, 10)) {
			return;
		}

		dispatchManualOperation({
			id: makeId("op-manual"),
			type: "MOVE_TASK_DATE",
			summary: `Manual: move due date for ${task.title}`,
			rationale: "Seller manually updated the MAP.",
			basis: "Manual change",
			taskId: task.id,
			newDueDate: normalizedDueDate,
		});
	}

	function handleOwnerChange(newOwner: string) {
		setOwnerDraft(newOwner);
		if (newOwner !== task.owner) {
			dispatchManualOperation({
				id: makeId("op-manual"),
				type: "REASSIGN_TASK",
				summary: `Manual: reassign owner for ${task.title}`,
				rationale: "Seller manually updated the MAP.",
				basis: "Manual change",
				taskId: task.id,
				newOwner,
			});
		}
	}

	function handleStatusChange(newStatus: Task["status"]) {
		setStatusDraft(newStatus);
		if (newStatus !== task.status) {
			dispatchManualOperation({
				id: makeId("op-manual"),
				type: "CHANGE_TASK_STATUS",
				summary: `Manual: change status for ${task.title}`,
				rationale: "Seller manually updated the MAP.",
				basis: "Manual change",
				taskId: task.id,
				newStatus,
			});
		}
	}

	const riskRowClass = RISK_ROW_CLASS[task.status] ?? "";

	return (
		<li className="py-3">
			<div
				className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${riskRowClass}`}
			>
				<div>
					<p className="font-medium text-slate-900">{task.title}</p>
					<span className="relative mt-1 inline-flex items-center rounded-md hover:bg-slate-100 focus-within:outline focus-within:outline-2 focus-within:outline-indigo-500">
						<OwnerBadge owner={ownerDraft} />
						<select
							value={ownerDraft}
							onChange={(event) => handleOwnerChange(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									setOwnerDraft(task.owner);
								}
							}}
							aria-label="Task owner"
							className="absolute inset-0 cursor-pointer appearance-none opacity-0"
						>
							<optgroup label="Seller · Northwind">
								{sellerParticipants.map((participant) => (
									<option key={participant.id} value={participant.name}>
										{participant.name}
									</option>
								))}
							</optgroup>
							<optgroup label="Buyer · Acme">
								{buyerParticipants.map((participant) => (
									<option key={participant.id} value={participant.name}>
										{participant.name}
									</option>
								))}
							</optgroup>
						</select>
					</span>
				</div>
				<div className="flex items-center gap-3">
					<span className="inline-flex items-center gap-1">
						<span className="text-sm text-slate-500">Due</span>
						<input
							type="date"
							value={dueDateDraft}
							onChange={(event) => {
								const next = event.target.value;
								setDueDateDraft(next);
								commitDueDate(next);
							}}
							onBlur={() => commitDueDate()}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									setDueDateDraft(task.dueDate.slice(0, 10));
									event.currentTarget.blur();
								}

								if (event.key === "Enter") {
									event.currentTarget.blur();
								}
							}}
							aria-label="Due date"
							className="cursor-pointer appearance-none rounded-md bg-transparent px-1 py-0.5 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
						/>
					</span>
					<select
						value={statusDraft}
						onChange={(event) =>
							handleStatusChange(event.target.value as Task["status"])
						}
						onKeyDown={(event) => {
							if (event.key === "Escape") {
								setStatusDraft(task.status);
							}
						}}
						aria-label="Task status"
						className={`cursor-pointer appearance-none rounded-full py-0.5 pl-2 pr-2 text-xs font-semibold capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${statusStyles[statusDraft]}`}
					>
						{TASK_STATUSES.map((status) => (
							<option key={status} value={status}>
								{status}
							</option>
						))}
					</select>
					<Button
						variant="secondary"
						onClick={() => setIsExpanded((value) => !value)}
					>
						{isExpanded ? "Hide history" : "Show history"}
					</Button>
				</div>
			</div>

			<div className={`collapsible ${isExpanded ? "is-open" : ""}`}>
				<div className="collapsible-inner">
					<div className="mt-2 ml-4 border-l-2 border-slate-200 pl-4">
						<TaskHistory events={taskEvents} />
					</div>
				</div>
			</div>
		</li>
	);
}
