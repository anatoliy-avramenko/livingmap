import type { TaskStatus } from "@/lib/types";

export const statusStyles: Record<TaskStatus, string> = {
	done: "bg-emerald-100 text-emerald-800",
	"in-progress": "bg-blue-100 text-blue-800",
	"not-started": "bg-slate-100 text-slate-700",
	"at-risk": "bg-amber-100 text-amber-900",
	blocked: "bg-rose-100 text-rose-900",
};
