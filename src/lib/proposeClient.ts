import { cachedProposalsBySignalId } from "@/fixtures/acmeMap";
import { makeId } from "./ids";
import type {
	MapState,
	Milestone,
	Proposal,
	ProposeResponse,
	ReviewableOperation,
	Signal,
	Task,
} from "./types";

type MapSnapshot = {
	milestones: Array<Pick<Milestone, "id" | "title" | "order">>;
	tasks: Array<
		Pick<Task, "id" | "milestoneId" | "title" | "owner" | "dueDate" | "status">
	>;
};

type RequestOptions = {
	signal: Signal;
	map: MapSnapshot;
	allowCachedFallback: boolean;
};

function toReviewableOperations(
	operations: ProposeResponse["operations"],
): ReviewableOperation[] {
	return operations.map((operation) => ({
		operation,
		decision: "pending",
	}));
}

function toProposal(
	signal: Signal,
	response: ProposeResponse,
	source: Proposal["source"],
): Proposal {
	return {
		id: makeId("proposal"),
		signal,
		signalSummary: response.signalSummary,
		reasoning: response.reasoning,
		inferredSource: response.inferredSource,
		operations: toReviewableOperations(response.operations),
		createdAt: new Date().toISOString(),
		source,
	};
}

async function requestLiveProposal(
	signal: Signal,
	map: MapSnapshot,
): Promise<ProposeResponse> {
	const signalForRoute = {
		id: signal.id,
		source: signal.source,
		label: signal.label,
		content: signal.content,
		occurredAt: signal.occurredAt,
	};

	const response = await fetch("/api/propose", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			signal: signalForRoute,
			map,
			mode: "live",
		}),
	});

	if (!response.ok) {
		throw new Error("Live proposal request failed");
	}

	return (await response.json()) as ProposeResponse;
}

export async function requestProposal({
	signal,
	map,
	allowCachedFallback,
}: RequestOptions): Promise<Proposal> {
	try {
		const liveResponse = await requestLiveProposal(signal, map);
		return toProposal(signal, liveResponse, "live");
	} catch {
		if (allowCachedFallback) {
			const cachedResponse = cachedProposalsBySignalId[signal.id];
			if (cachedResponse) {
				return toProposal(signal, cachedResponse, "cached");
			}
		}

		throw new Error("Live engine unavailable");
	}
}

export function buildMapSnapshot(
	state: Pick<MapState, "milestones" | "tasksById">,
): MapSnapshot {
	const milestones = state.milestones.map((milestone) => ({
		id: milestone.id,
		title: milestone.title,
		order: milestone.order,
	}));

	const tasks = Object.values(state.tasksById).map((task) => ({
		id: task.id,
		milestoneId: task.milestoneId,
		title: task.title,
		owner: task.owner,
		dueDate: task.dueDate,
		status: task.status,
	}));

	return { milestones, tasks };
}
