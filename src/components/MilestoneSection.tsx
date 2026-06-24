import type { Dispatch } from "react";
import { useEffect, useRef, useState } from "react";
import type { MapAction } from "@/lib/actions";
import { makeId } from "@/lib/ids";
import type { MapEvent, Milestone, Participant, Task } from "@/lib/types";
import { Button } from "./Button";
import { TaskRow } from "./TaskRow";

type MilestoneSectionProps = {
	milestone: Milestone;
	tasks: Task[];
	progress: { done: number; total: number };
	events: MapEvent[];
	participants: Participant[];
	dispatch: Dispatch<MapAction>;
};

export function MilestoneSection({
	milestone,
	tasks,
	progress,
	events,
	participants,
	dispatch,
}: MilestoneSectionProps) {
	const [taskTitle, setTaskTitle] = useState("");
	const [taskOwner, setTaskOwner] = useState(participants[0]?.name ?? "");
	const [taskDueDate, setTaskDueDate] = useState("");
	const [taskStatus, setTaskStatus] = useState<Task["status"]>("not-started");
	const [isAddingTask, setIsAddingTask] = useState(false);
	const taskTitleInputRef = useRef<HTMLInputElement | null>(null);
	const progressPercent =
		progress.total === 0
			? 0
			: Math.round((progress.done / progress.total) * 100);
	const sellerParticipants = participants.filter(
		(participant) => participant.side === "seller",
	);
	const buyerParticipants = participants.filter(
		(participant) => participant.side === "buyer",
	);

	function resetTaskForm() {
		setTaskTitle("");
		setTaskOwner(participants[0]?.name ?? "");
		setTaskDueDate("");
		setTaskStatus("not-started");
	}

	useEffect(() => {
		if (isAddingTask) {
			taskTitleInputRef.current?.focus();
		}
	}, [isAddingTask]);

	return (
		<section className="rounded-lg border border-slate-200 bg-white p-4">
			<div className="mb-3 flex items-center justify-between gap-3">
				<h2 className="min-w-0 text-lg font-semibold text-slate-900">
					{milestone.title}
				</h2>
				<div className="flex shrink-0 items-center gap-2">
					<div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
						<div
							className="h-full rounded-full bg-emerald-500 transition-[width]"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
					<span className="text-xs font-medium text-slate-600">
						{progress.done}/{progress.total}
					</span>
				</div>
			</div>
			{tasks.length > 0 ? (
				<ul className="divide-y divide-slate-200">
					{tasks.map((task) => (
						<TaskRow
							key={task.id}
							task={task}
							events={events}
							participants={participants}
							dispatch={dispatch}
						/>
					))}
				</ul>
			) : null}
			<div className="mt-3">
				{isAddingTask ? (
					<form
						className="animate-fade-in-up"
						onKeyDown={(event) => {
							if (event.key !== "Escape") {
								return;
							}

							event.preventDefault();
							resetTaskForm();
							setIsAddingTask(false);
						}}
						onSubmit={(event) => {
							event.preventDefault();

							const title = taskTitle.trim();
							if (!title || !taskOwner || !taskDueDate) {
								return;
							}

							dispatch({
								type: "APPLY_MANUAL_OPERATION",
								operation: {
									id: makeId("op-manual"),
									type: "ADD_TASK",
									summary: `Manual: add task ${title}`,
									rationale: "Seller manually updated the MAP.",
									basis: "Manual change",
									milestoneId: milestone.id,
									title,
									owner: taskOwner,
									dueDate: taskDueDate,
									status: taskStatus,
								},
								appliedAt: new Date().toISOString(),
								mutationId: makeId("manual"),
							});

							resetTaskForm();
							setIsAddingTask(false);
						}}
					>
						<p className="mb-2 text-xs font-medium text-slate-700">Add Task</p>
						<div className="grid gap-2 sm:grid-cols-2">
							<input
								ref={taskTitleInputRef}
								type="text"
								value={taskTitle}
								onChange={(event) => setTaskTitle(event.target.value)}
								placeholder="Task title"
								className="rounded border border-slate-300 px-2 py-1 text-sm"
							/>
							<select
								value={taskOwner}
								onChange={(event) => setTaskOwner(event.target.value)}
								className="rounded border border-slate-300 px-2 py-1 text-sm"
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
							<input
								type="date"
								value={taskDueDate}
								onChange={(event) => setTaskDueDate(event.target.value)}
								className="rounded border border-slate-300 px-2 py-1 text-sm"
							/>
							<select
								value={taskStatus}
								onChange={(event) =>
									setTaskStatus(event.target.value as Task["status"])
								}
								className="rounded border border-slate-300 px-2 py-1 text-sm"
							>
								<option value="not-started">not-started</option>
								<option value="in-progress">in-progress</option>
								<option value="done">done</option>
								<option value="at-risk">at-risk</option>
								<option value="blocked">blocked</option>
							</select>
						</div>
						<div className="mt-2 flex items-center gap-2">
							<Button variant="primary" type="submit">
								Create task
							</Button>
							<Button
								variant="secondary"
								onClick={() => {
									resetTaskForm();
									setIsAddingTask(false);
								}}
							>
								Cancel
							</Button>
						</div>
					</form>
				) : (
					<Button
						variant="secondary"
						onClick={() => setIsAddingTask(true)}
					>
						＋ Add task
					</Button>
				)}
			</div>
		</section>
	);
}
