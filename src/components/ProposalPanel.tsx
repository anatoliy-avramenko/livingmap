"use client";

import type { Dispatch } from "react";
import { useState } from "react";
import type { MapAction } from "@/lib/actions";
import type { MapState } from "@/lib/types";
import { LoadingStatus } from "./LoadingStatus";
import { OperationCard } from "./OperationCard";

type ProposalPanelProps = {
	state: MapState;
	dispatch: Dispatch<MapAction>;
	isLoading: boolean;
	onDismiss: () => void;
};

function getNowIso(): string {
	return new Date().toISOString();
}

export function ProposalPanel({
	state,
	dispatch,
	isLoading,
	onDismiss,
}: ProposalPanelProps) {
	const proposal = state.activeProposal;
	const [isReasoningOpen, setIsReasoningOpen] = useState(false);

	if (!proposal) {
		return (
			<section className="rounded-lg border border-slate-200 bg-white p-4">
				<h3 className="mb-2 text-lg font-semibold text-slate-900">
					Proposal Review
				</h3>
				{isLoading ? (
					<LoadingStatus />
				) : (
					<p className="text-sm text-slate-600">No active Proposal yet.</p>
				)}
			</section>
		);
	}

	return (
		<section className="rounded-lg border border-slate-200 bg-white p-4">
			<div className="mb-3">
				<h3 className="text-lg font-semibold text-slate-900">
					Proposal Review
				</h3>
				{proposal.source === "cached" ? (
					<span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
						AI offline — cached
					</span>
				) : null}
				<p className="mt-1 break-words text-sm text-slate-800">
					Trigger: {proposal.signalSummary}
				</p>
				<button
					type="button"
					onClick={() => setIsReasoningOpen((value) => !value)}
					className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900"
				>
					{isReasoningOpen ? "Hide reasoning" : "Show reasoning"}
				</button>
				<div className={`collapsible ${isReasoningOpen ? "is-open" : ""}`}>
					<div className="collapsible-inner">
						<p className="mt-1 break-words text-xs text-slate-500">
							{proposal.reasoning}
						</p>
					</div>
				</div>
			</div>
			{proposal.operations.length === 0 ? (
				<p className="py-1 text-sm text-slate-600">
					No actionable changes proposed.
				</p>
			) : null}
			<ul className="divide-y divide-slate-200">
				{proposal.operations.map((reviewableOperation) => (
					<OperationCard
						key={reviewableOperation.operation.id}
						reviewableOperation={reviewableOperation}
						tasksById={state.tasksById}
						onApprove={() => {
							dispatch({
								type: "APPROVE_OPERATION",
								operationId: reviewableOperation.operation.id,
								approvedAt: getNowIso(),
							});
						}}
						onReject={() => {
							dispatch({
								type: "REJECT_OPERATION",
								operationId: reviewableOperation.operation.id,
								rejectedAt: getNowIso(),
							});
						}}
					/>
				))}
			</ul>
			<button
				type="button"
				onClick={onDismiss}
				className="mt-4 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
			>
				Dismiss proposal
			</button>
		</section>
	);
}
