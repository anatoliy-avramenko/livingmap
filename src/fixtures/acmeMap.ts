import type {
	MapState,
	Milestone,
	Participant,
	Signal,
	Task,
} from "@/lib/types";

export const TODAY = "2026-06-23";

const milestones: Milestone[] = [
	{
		id: "milestone-discovery-alignment",
		title: "Discovery & Alignment",
		order: 1,
		taskIds: [
			"task-discovery-call-buying-committee",
			"task-document-pain-points",
			"task-confirm-success-criteria",
		],
	},
	{
		id: "milestone-technical-validation",
		title: "Technical Validation",
		order: 2,
		taskIds: [
			"task-security-compliance-review",
			"task-integration-poc-acme-data",
			"task-performance-benchmark-signoff",
		],
	},
	{
		id: "milestone-commercials",
		title: "Commercials",
		order: 3,
		taskIds: [
			"task-pricing-proposal-delivered",
			"task-procurement-vendor-onboarding",
		],
	},
	{
		id: "milestone-close",
		title: "Close",
		order: 4,
		taskIds: ["task-mutual-close-plan-signed"],
	},
];

const tasks: Task[] = [
	{
		id: "task-discovery-call-buying-committee",
		milestoneId: "milestone-discovery-alignment",
		title: "Discovery call with buying committee",
		owner: "Dana (AE)",
		dueDate: "2026-06-10",
		status: "done",
	},
	{
		id: "task-document-pain-points",
		milestoneId: "milestone-discovery-alignment",
		title: "Document current-state pain points",
		owner: "Dana (AE)",
		dueDate: "2026-06-12",
		status: "done",
	},
	{
		id: "task-confirm-success-criteria",
		milestoneId: "milestone-discovery-alignment",
		title: "Confirm success criteria with champion",
		owner: "Marcus (Champion)",
		dueDate: "2026-06-25",
		status: "in-progress",
	},
	{
		id: "task-security-compliance-review",
		milestoneId: "milestone-technical-validation",
		title: "Security & compliance review",
		owner: "Priya (Buyer, Security)",
		dueDate: "2026-06-24",
		status: "at-risk",
	},
	{
		id: "task-integration-poc-acme-data",
		milestoneId: "milestone-technical-validation",
		title: "Integration POC with Acme data",
		owner: "Sam (SE)",
		dueDate: "2026-06-28",
		status: "in-progress",
	},
	{
		id: "task-performance-benchmark-signoff",
		milestoneId: "milestone-technical-validation",
		title: "Performance benchmark sign-off",
		owner: "Sam (SE)",
		dueDate: "2026-06-22",
		status: "not-started",
	},
	{
		id: "task-pricing-proposal-delivered",
		milestoneId: "milestone-commercials",
		title: "Pricing proposal delivered",
		owner: "Dana (AE)",
		dueDate: "2026-06-30",
		status: "not-started",
	},
	{
		id: "task-procurement-vendor-onboarding",
		milestoneId: "milestone-commercials",
		title: "Procurement / vendor onboarding",
		owner: "Raj (Procurement)",
		dueDate: "2026-07-03",
		status: "not-started",
	},
	{
		id: "task-mutual-close-plan-signed",
		milestoneId: "milestone-close",
		title: "Mutual close plan signed",
		owner: "Dana (AE)",
		dueDate: "2026-07-08",
		status: "not-started",
	},
];

const tasksById = Object.fromEntries(tasks.map((task) => [task.id, task]));

const participants: Participant[] = [
	{ id: "participant-northwind-dana", name: "Dana (AE)", side: "seller" },
	{ id: "participant-northwind-sam", name: "Sam (SE)", side: "seller" },
	{
		id: "participant-northwind-jules",
		name: "Jules (CSM)",
		side: "seller",
	},
	{
		id: "participant-acme-marcus",
		name: "Marcus (Champion)",
		side: "buyer",
	},
	{
		id: "participant-acme-priya",
		name: "Priya (Buyer, Security)",
		side: "buyer",
	},
	{
		id: "participant-acme-raj",
		name: "Raj (Procurement)",
		side: "buyer",
	},
	{ id: "participant-acme-olivia", name: "Olivia (CFO)", side: "buyer" },
];

export const initialMapState: MapState = {
	milestones,
	tasksById,
	participants,
	events: [],
	activeProposal: null,
	signalQueue: [],
};

export const curatedSignals: Signal[] = [
	{
		id: "signal-budget-shift-q3",
		source: "transcript",
		label: "Transcript: budget shifted to next quarter",
		content:
			"In today's steering call, the champion said budget approval moved to next quarter and asked to push commercial commitment dates by 2-3 weeks.",
		occurredAt: `${TODAY}T10:00:00.000Z`,
	},
	{
		id: "signal-soc2-concern",
		source: "transcript",
		label: "Transcript: SOC2 deep-dive requested",
		content:
			"Buyer security asked for a SOC2 deep-dive and said they cannot continue review until this session is scheduled.",
		occurredAt: `${TODAY}T11:00:00.000Z`,
	},
	{
		id: "signal-new-cfo-stakeholder",
		source: "transcript",
		label: "Transcript: CFO joined approval committee",
		content:
			"A newly involved CFO asked for a dedicated financial justification review before final procurement sign-off.",
		occurredAt: `${TODAY}T13:00:00.000Z`,
	},
	{
		id: "signal-pricing-deck-engaged",
		source: "engagement",
		label: "Engagement: pricing deck opened 6x",
		content:
			"Buying committee viewed the pricing deck six times in the last two days, including repeat opens by finance.",
		occurredAt: `${TODAY}T14:00:00.000Z`,
	},
	{
		id: "signal-security-docs-no-engagement",
		source: "engagement",
		label: "Engagement: no views on security docs",
		content: "No buyer views on shared security documentation for nine days.",
		occurredAt: `${TODAY}T15:00:00.000Z`,
	},
	{
		id: "signal-procurement-contact-active",
		source: "engagement",
		label: "Engagement: procurement repeatedly viewed MSA",
		content:
			"The procurement contact viewed the MSA and onboarding package multiple times this week.",
		occurredAt: `${TODAY}T16:00:00.000Z`,
	},
	{
		id: "signal-performance-overdue",
		source: "elapsed-time",
		label: "Elapsed time: performance sign-off overdue",
		content:
			"Due date passed for 'Performance benchmark sign-off' without completion.",
		occurredAt: `${TODAY}T17:00:00.000Z`,
	},
	{
		id: "signal-success-criteria-overdue",
		source: "elapsed-time",
		label: "Elapsed time: success-criteria task overdue",
		content:
			"The 'Confirm success criteria with champion' task is now five days overdue.",
		occurredAt: `${TODAY}T18:00:00.000Z`,
	},
];
