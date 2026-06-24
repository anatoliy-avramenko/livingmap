import type { Dispatch } from "react";
import type { MapAction } from "@/lib/actions";
import { getMilestoneProgress } from "@/lib/reducer";
import type { MapState } from "@/lib/types";
import { MilestoneSection } from "./MilestoneSection";

function isDefinedTask(
	task: MapState["tasksById"][string] | undefined,
): task is MapState["tasksById"][string] {
	return Boolean(task);
}

type ActionPlanListProps = {
	state: MapState;
	dispatch: Dispatch<MapAction>;
};

export function ActionPlanList({ state, dispatch }: ActionPlanListProps) {
	return (
		<div className="space-y-4">
			{state.milestones
				.slice()
				.sort((left, right) => left.order - right.order)
				.map((milestone) => {
					const tasks = milestone.taskIds
						.map((taskId) => state.tasksById[taskId])
						.filter(isDefinedTask);

					return (
						<MilestoneSection
							key={milestone.id}
							milestone={milestone}
							tasks={tasks}
							progress={getMilestoneProgress(state, milestone.id)}
							events={state.events}
							participants={state.participants}
							dispatch={dispatch}
						/>
					);
				})}
		</div>
	);
}
