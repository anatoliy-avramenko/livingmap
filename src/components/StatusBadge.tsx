import type { TaskStatus } from "@/lib/types";

export const statusStyles: Record<TaskStatus, string> = {
	done: "bg-emerald-100 text-emerald-800",
	"in-progress": "bg-blue-100 text-blue-800",
	"not-started": "bg-slate-100 text-slate-700",
	"at-risk": "bg-amber-100 text-amber-900",
	blocked: "bg-rose-100 text-rose-900",
};

function formatStatus(status: TaskStatus): string {
	return status.replace("-", " ");
}

type StatusBadgeProps = {
	status: TaskStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
	return (
		<span
			className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[status]}`}
		>
			{formatStatus(status)}
		</span>
	);
}
