import type { MapEvent } from "@/lib/types";

type TaskHistoryProps = {
	events: MapEvent[];
};

function eventKindLabel(event: MapEvent): string {
	if (event.triggeredBy === "manual") {
		return "Manual";
	}

	if (event.kind === "operation-approved") {
		return "AI proposal — approved";
	}

	return "AI proposal — rejected";
}

function kindBadgeClassName(event: MapEvent): string {
	if (event.triggeredBy === "manual") {
		return "bg-indigo-50 text-indigo-700";
	}

	if (event.kind === "operation-approved") {
		return "bg-emerald-50 text-emerald-700";
	}

	return "bg-rose-50 text-rose-700";
}

export function TaskHistory({ events }: TaskHistoryProps) {
	if (events.length === 0) {
		return <p className="text-xs text-slate-500">No history yet.</p>;
	}

	return (
		<ul className="divide-y divide-slate-200">
			{events.map((event) => {
				return (
					<li key={event.id} className="py-2 text-xs">
						<div className="mb-1 flex items-center gap-2">
							<span
								className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${kindBadgeClassName(event)}`}
							>
								{eventKindLabel(event)}
							</span>
						</div>
						<p>
							<span className="text-slate-500">Author: </span>
							<span className="text-slate-700">Seller</span>
						</p>
						<p
							className={
								event.kind === "operation-rejected" ? "line-through" : ""
							}
						>
							<span className="text-slate-500">Description: </span>
							<span className="text-slate-700">{event.description}</span>
						</p>
						{event.basis ? (
							<p>
								<span className="text-slate-500">Basis: </span>
								<span className="text-slate-700">{event.basis}</span>
							</p>
						) : null}
						<p>
							<span className="text-slate-500">Timestamp: </span>
							<span className="text-slate-700">{event.createdAt}</span>
						</p>
					</li>
				);
			})}
		</ul>
	);
}
