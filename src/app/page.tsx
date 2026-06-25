"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ActionPlanList } from "@/components/ActionPlanList";
import { Button } from "@/components/Button";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ProposalPanel } from "@/components/ProposalPanel";
import { SignalInjector } from "@/components/SignalInjector";
import { curatedSignals, initialMapState } from "@/fixtures/acmeMap";
import { makeId } from "@/lib/ids";
import { buildMapSnapshot, requestProposal } from "@/lib/proposeClient";
import { mapReducer } from "@/lib/reducer";
import type { Proposal, Signal, SignalSource } from "@/lib/types";

type SessionSignalEntryStatus =
	| "waiting"
	| "processing"
	| "awaiting-review"
	| "resolved"
	| "unavailable";

type SessionSignalEntry = {
	sessionId: string;
	signalId: string;
	source: SignalSource;
	label: string;
	content: string;
	firedAt: string;
	status: SessionSignalEntryStatus;
	proposedOperations: number;
	approvedOperations: number;
	rejectedOperations: number;
};

type OperationCounts = {
	proposed: number;
	approved: number;
	rejected: number;
	pending: number;
};

function sourceLabel(source: SignalSource): string {
	if (/[A-Z]/.test(source)) {
		return source;
	}

	const spaced = source.replace(/[-_]/g, " ");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function updateEntryBySessionId(
	entries: SessionSignalEntry[],
	sessionId: string,
	updater: (entry: SessionSignalEntry) => SessionSignalEntry,
): SessionSignalEntry[] {
	const index = entries.findIndex((entry) => entry.sessionId === sessionId);

	if (index === -1) {
		return entries;
	}

	return entries.map((entry, currentIndex) => {
		if (currentIndex !== index) {
			return entry;
		}

		return updater(entry);
	});
}

function findOldestWaitingEntry(
	entries: SessionSignalEntry[],
	signalId: string,
): SessionSignalEntry | null {
	return (
		entries.find(
			(entry) => entry.signalId === signalId && entry.status === "waiting",
		) ?? null
	);
}

function countProposalOperations(proposal: Proposal): OperationCounts {
	const proposed = proposal.operations.length;
	const approved = proposal.operations.filter(
		(reviewableOperation) => reviewableOperation.decision === "approved",
	).length;
	const rejected = proposal.operations.filter(
		(reviewableOperation) => reviewableOperation.decision === "rejected",
	).length;

	return {
		proposed,
		approved,
		rejected,
		pending: Math.max(0, proposed - approved - rejected),
	};
}

function countsForEntry(
	entry: SessionSignalEntry,
	activeProposal: Proposal | null,
): OperationCounts {
	if (activeProposal && entry.signalId === activeProposal.signal.id) {
		return countProposalOperations(activeProposal);
	}

	const proposed = entry.proposedOperations;
	const approved = entry.approvedOperations;
	const rejected = entry.rejectedOperations;

	return {
		proposed,
		approved,
		rejected,
		pending: Math.max(0, proposed - approved - rejected),
	};
}

function summarizeEntry(entry: SessionSignalEntry, counts: OperationCounts): string {
	if (entry.status === "waiting") {
		return "Waiting in queue";
	}

	if (entry.status === "processing") {
		return "Generating proposal...";
	}

	if (entry.status === "unavailable") {
		return "Live engine unavailable";
	}

	return `${counts.proposed} proposed · ${counts.approved} approved · ${counts.rejected} rejected${counts.pending > 0 ? ` · ${counts.pending} pending` : ""}`;
}

function statusChip(entry: SessionSignalEntry) {
	if (entry.status === "waiting") {
		return (
			<span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
				⧗ Queued
			</span>
		);
	}

	if (entry.status === "processing") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
				<span
					aria-hidden="true"
					className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-600"
				/>
				● Processing…
			</span>
		);
	}

	if (entry.status === "awaiting-review") {
		return (
			<span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
				◳ Awaiting review
			</span>
		);
	}

	if (entry.status === "unavailable") {
		return (
			<span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
				⚠ Live engine unavailable
			</span>
		);
	}

	return (
		<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
			✓ Resolved
		</span>
	);
}

function renderSessionEntry(entry: SessionSignalEntry, activeProposal: Proposal | null) {
	const counts = countsForEntry(entry, activeProposal);

	return (
		<li key={entry.sessionId} className="py-2 text-xs">
			<div className="mb-1 flex items-start justify-between gap-2">
				<p className="font-medium text-slate-800">
					{sourceLabel(entry.source)}: {entry.label}
				</p>
				{statusChip(entry)}
			</div>
			<p className="text-slate-500">{entry.content}</p>
			<p className="text-slate-600">{summarizeEntry(entry, counts)}</p>
		</li>
	);
}

export default function Home() {
	const [state, dispatch] = useReducer(mapReducer, initialMapState);
	const [isLoadingProposal, setIsLoadingProposal] = useState(false);
	const [injectorError, setInjectorError] = useState<string | null>(null);
	const [sessionSignals, setSessionSignals] = useState<SessionSignalEntry[]>(
		[],
	);
	const [isDemoOpen, setIsDemoOpen] = useState(true);
	const isPumpBusyRef = useRef(false);
	const sessionLogRef = useRef<HTMLUListElement | null>(null);
	const previousActiveProposalRef = useRef<Proposal | null>(null);

	useEffect(() => {
		const sessionLog = sessionLogRef.current;
		if (sessionLog) {
			sessionLog.scrollTop = sessionLog.scrollHeight;
		}
	}, [sessionSignals.length]);

	useEffect(() => {
		const previousActiveProposal = previousActiveProposalRef.current;
		const currentActiveProposal = state.activeProposal;

		if (
			previousActiveProposal &&
			(!currentActiveProposal ||
				currentActiveProposal.signal.id !== previousActiveProposal.signal.id)
		) {
			const counts = countProposalOperations(previousActiveProposal);

			setSessionSignals((entries) =>
				entries.map((entry) => {
					if (
						entry.signalId !== previousActiveProposal.signal.id ||
						entry.status !== "awaiting-review"
					) {
						return entry;
					}

					return {
						...entry,
						status: "resolved",
						proposedOperations: counts.proposed,
						approvedOperations: counts.approved,
						rejectedOperations: counts.rejected,
					};
				}),
			);
		}

		previousActiveProposalRef.current = currentActiveProposal;
	}, [state.activeProposal]);

	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (
			state.activeProposal ||
			state.signalQueue.length === 0 ||
			isLoadingProposal ||
			isPumpBusyRef.current
		) {
			return;
		}

		const signal = state.signalQueue[0];
		const waitingEntry = findOldestWaitingEntry(sessionSignals, signal.id);
		if (!waitingEntry) {
			return;
		}

		const sessionId = waitingEntry.sessionId;

		isPumpBusyRef.current = true;
		setIsLoadingProposal(true);
		setSessionSignals((entries) =>
			updateEntryBySessionId(entries, sessionId, (entry) => ({
				...entry,
				status: "processing",
			})),
		);
		dispatch({ type: "DEQUEUE_SIGNAL" });

		void requestProposal({
			signal,
			map: buildMapSnapshot(state),
		})
			.then((proposal) => {
				const nextStatus =
					proposal.operations.length === 0 ? "resolved" : "awaiting-review";

				setSessionSignals((entries) =>
					updateEntryBySessionId(entries, sessionId, (entry) => ({
						...entry,
						source: proposal.inferredSource ?? entry.source,
						status: nextStatus,
						proposedOperations: proposal.operations.length,
					})),
				);

				dispatch({
					type: "RECEIVE_PROPOSAL",
					proposal,
				});
			})
			.catch(() => {
				setInjectorError(
					"Live engine unavailable. Set the server API key and retry.",
				);

				setSessionSignals((entries) =>
					updateEntryBySessionId(entries, sessionId, (entry) => ({
						...entry,
						status: "unavailable",
					})),
				);
			})
			.finally(() => {
				isPumpBusyRef.current = false;
				setIsLoadingProposal(false);
			});
	}, [state, isLoadingProposal, sessionSignals]);
	/* eslint-enable react-hooks/set-state-in-effect */

	function fireSignal(signal: Signal) {
		setInjectorError(null);
		setSessionSignals((entries) => [
			...entries,
			{
				sessionId: makeId("session-signal"),
				signalId: signal.id,
				source: signal.source,
				label: signal.label,
				content: signal.content,
				firedAt: new Date().toISOString(),
				status: "waiting",
				proposedOperations: 0,
				approvedOperations: 0,
				rejectedOperations: 0,
			},
		]);

		dispatch({
			type: "ENQUEUE_SIGNAL",
			signal,
		});
	}

	function handleInjectedSignal(payload: { content: string }) {
		setInjectorError(null);

		const injectedSignal: Signal = {
			id: makeId("signal"),
			label: "Custom injected signal",
			content: payload.content,
			source: "pending",
			occurredAt: new Date().toISOString(),
		};

		fireSignal(injectedSignal);
	}

	function handleDismissProposal() {
		const activeProposal = state.activeProposal;
		if (!activeProposal) {
			dispatch({ type: "DISMISS_PROPOSAL" });
			return;
		}

		const activeSignalId = activeProposal.signal.id;
		const counts = countProposalOperations(activeProposal);

		setSessionSignals((entries) => {
			return entries.map((entry) => {
				if (
					entry.signalId !== activeSignalId ||
					entry.status !== "awaiting-review"
				) {
					return entry;
				}

				return {
					...entry,
					status: "resolved",
					proposedOperations: counts.proposed,
					approvedOperations: counts.approved,
					rejectedOperations: counts.rejected,
				};
			});
		});

		dispatch({ type: "DISMISS_PROPOSAL" });
	}

	return (
		<main className="min-h-screen bg-slate-100 p-6">
			<div className="mx-auto mb-6 max-w-7xl rounded-lg border border-slate-200 bg-white p-4">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<h1 className="text-3xl font-bold text-slate-900">
							Mutual Action Plan
						</h1>
						<InfoTooltip variant="prominent" label="What is this demo?">
							Demo of a Living Mutual Action Plan. An LLM reads incoming Signals
							(meeting transcripts, buyer engagement, elapsed time) and proposes
							changes to the plan; you approve each one. The Demo controls below
							let you inject Signals by hand to emulate what would arrive
							automatically in production.
						</InfoTooltip>
					</div>
					<div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
						<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
							<span
								className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-700"
								aria-hidden="true"
							>
								N
							</span>
							<span className="font-medium">Seller: Northwind</span>
						</div>
						<span aria-hidden="true" className="text-slate-400">
							→
						</span>
						<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
							<span
								className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-700"
								aria-hidden="true"
							>
								A
							</span>
							<span className="font-medium">Buyer: Acme</span>
						</div>
					</div>
				</div>
			</div>
			<section className="mx-auto mb-6 max-w-7xl rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/70 p-4">
				<div className="flex items-center justify-between gap-3">
					<h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
						Demo controls
					</h2>
					<Button
						variant="secondary"
						onClick={() => setIsDemoOpen((value) => !value)}
						aria-expanded={isDemoOpen}
					>
						{isDemoOpen ? "Hide" : "Show"}
					</Button>
				</div>
				<div className={`collapsible ${isDemoOpen ? "is-open" : ""}`}>
					<div className="collapsible-inner">
						<p className="mt-1 text-xs text-indigo-900/90">
							Simulates Signals that, in production, arrive automatically from CRM,
							meeting transcription, and engagement telemetry. Not part of the
							buyer/seller experience.
						</p>
						<div className="mt-3 grid gap-4 md:grid-cols-2">
							<div className="space-y-3">
								<SignalInjector
									examples={curatedSignals.map((signal) => signal.content)}
									onSubmit={handleInjectedSignal}
								/>
								{injectorError ? (
									<p className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
										{injectorError}
									</p>
								) : null}
							</div>
							<div className="min-h-0">
								<div className="mb-2 flex items-center justify-between">
									<h3 className="text-sm font-semibold text-slate-900">
										Signals session-log
									</h3>
									<span className="text-xs text-slate-600">
										Queued now: {state.signalQueue.length}
									</span>
								</div>
								<ul
									ref={sessionLogRef}
									className="max-h-[260px] divide-y divide-slate-200 overflow-y-auto pr-1"
								>
									<li className="py-2 text-xs text-indigo-900">
										<p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
											Initial MAP origin
										</p>
										<p>Initial MAP created from discovery meeting transcript.</p>
									</li>
									{sessionSignals.length === 0 ? (
										<li className="py-2 text-xs italic text-slate-400">
											No signals fired yet.
										</li>
									) : (
										sessionSignals.map((entry) =>
											renderSessionEntry(entry, state.activeProposal),
										)
									)}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</section>
			<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[2fr_1fr]">
				<section className="min-w-0">
					<ActionPlanList state={state} dispatch={dispatch} />
				</section>
				<aside className="min-w-0 space-y-4">
					<ProposalPanel
						state={state}
						dispatch={dispatch}
						isLoading={isLoadingProposal}
						onDismiss={handleDismissProposal}
					/>
				</aside>
			</div>
		</main>
	);
}
