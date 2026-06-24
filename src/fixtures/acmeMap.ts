import type {
	MapState,
	Milestone,
	Participant,
	ProposeResponse,
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

export const cachedProposalsBySignalId: Record<string, ProposeResponse> = {
	"signal-budget-shift-q3": {
		signalSummary:
			"Budget approval moved to next quarter, so close timeline should be adjusted.",
		reasoning:
			"The signal impacts late-stage commercial timing more than technical execution. Move key Commercials and Close due dates so the plan reflects the new decision window.",
		operations: [
			{
				id: "op-budget-move-pricing-date",
				type: "MOVE_TASK_DATE",
				summary:
					"Move pricing proposal due date to align with next-quarter budget",
				rationale:
					"Pricing delivery should happen closer to the revised budget approval timing.",
				basis: "Budget approval moved to next quarter",
				taskId: "task-pricing-proposal-delivered",
				newDueDate: "2026-07-15",
			},
			{
				id: "op-budget-move-close-plan-date",
				type: "MOVE_TASK_DATE",
				summary: "Move mutual close plan signing date by two weeks",
				rationale:
					"Close-plan commitment should trail the revised commercial schedule.",
				basis: "Commercial timeline shifted later",
				taskId: "task-mutual-close-plan-signed",
				newDueDate: "2026-07-22",
			},
		],
	},
	"signal-soc2-concern": {
		signalSummary:
			"Security review is blocked pending a SOC2 deep-dive session.",
		reasoning:
			"Set the existing security task to blocked to reflect immediate stoppage and add a concrete unblock action in Technical Validation.",
		operations: [
			{
				id: "op-soc2-block-security-review",
				type: "CHANGE_TASK_STATUS",
				summary: "Set Security & compliance review to blocked",
				rationale:
					"The team explicitly said work cannot proceed before the deep-dive.",
				basis: "SOC2 deep-dive blocks current review",
				taskId: "task-security-compliance-review",
				newStatus: "blocked",
			},
			{
				id: "op-soc2-add-deep-dive-task",
				type: "ADD_TASK",
				summary: "Add task to schedule SOC2 deep-dive session",
				rationale:
					"A dedicated scheduling task creates a clear path to remove the blocker.",
				basis: "Need concrete unblock action",
				milestoneId: "milestone-technical-validation",
				title: "Schedule SOC2 deep-dive with buyer security team",
				owner: "Dana (AE)",
				dueDate: "2026-06-26",
				status: "not-started",
			},
		],
	},
	"signal-new-cfo-stakeholder": {
		signalSummary:
			"A new CFO stakeholder introduced a financial review requirement.",
		reasoning:
			"Commercial approval now has an additional stakeholder and checkpoint, so add a milestone for executive sign-off and a task to run the CFO review.",
		operations: [
			{
				id: "op-cfo-add-milestone",
				type: "ADD_MILESTONE",
				summary: "Add milestone for executive financial sign-off",
				rationale:
					"The CFO requirement is a structural phase between Commercials and Close.",
				basis: "CFO introduced new approval phase",
				title: "Executive Sign-off",
				order: 4,
			},
			{
				id: "op-cfo-add-review-task",
				type: "ADD_TASK",
				summary: "Add task to run CFO value justification review",
				rationale:
					"Captures the new decision-maker's required review as an explicit deliverable.",
				basis: "CFO requested financial justification review",
				milestoneId: "milestone-commercials",
				title: "Run value justification review with CFO",
				owner: "Dana (AE)",
				dueDate: "2026-07-10",
				status: "not-started",
			},
		],
	},
	"signal-pricing-deck-engaged": {
		signalSummary:
			"Strong pricing-content engagement indicates active commercial evaluation.",
		reasoning:
			"The pricing stream appears active, so mark the pricing task in-progress and add a follow-up to answer finance questions quickly.",
		operations: [
			{
				id: "op-engagement-pricing-in-progress",
				type: "CHANGE_TASK_STATUS",
				summary: "Set Pricing proposal delivered to in-progress",
				rationale:
					"High repeat views imply active review rather than dormant work.",
				basis: "Pricing deck engagement spiked",
				taskId: "task-pricing-proposal-delivered",
				newStatus: "in-progress",
			},
			{
				id: "op-engagement-add-finance-follow-up",
				type: "ADD_TASK",
				summary: "Add task to send pricing Q&A follow-up",
				rationale:
					"Prompt follow-up can convert engagement into decision momentum.",
				basis: "Finance engagement needs timely follow-up",
				milestoneId: "milestone-commercials",
				title: "Send pricing Q&A follow-up to finance stakeholders",
				owner: "Dana (AE)",
				dueDate: "2026-06-25",
				status: "not-started",
			},
		],
	},
	"signal-security-docs-no-engagement": {
		signalSummary:
			"Security validation momentum is weak due to prolonged inactivity.",
		reasoning:
			"Extended inactivity on security artifacts suggests heightened risk for the technical track.",
		operations: [
			{
				id: "op-engagement-security-at-risk",
				type: "CHANGE_TASK_STATUS",
				summary: "Set Security & compliance review to at-risk",
				rationale: "Nine days without engagement is a clear risk indicator.",
				basis: "No security-doc engagement for nine days",
				taskId: "task-security-compliance-review",
				newStatus: "at-risk",
			},
		],
	},
	"signal-procurement-contact-active": {
		signalSummary:
			"Procurement is actively reviewing contract/onboarding materials.",
		reasoning:
			"Repeated procurement activity supports moving vendor onboarding into active execution.",
		operations: [
			{
				id: "op-engagement-procurement-in-progress",
				type: "CHANGE_TASK_STATUS",
				summary: "Set Procurement / vendor onboarding to in-progress",
				rationale: "Repeated MSA engagement indicates active procurement work.",
				basis: "Procurement repeatedly viewed onboarding documents",
				taskId: "task-procurement-vendor-onboarding",
				newStatus: "in-progress",
			},
		],
	},
	"signal-performance-overdue": {
		signalSummary:
			"Performance benchmark sign-off is overdue and now schedule-risked.",
		reasoning:
			"An overdue not-started validation task should be marked at-risk and rescheduled to a realistic near-term date.",
		operations: [
			{
				id: "op-elapsed-performance-at-risk",
				type: "CHANGE_TASK_STATUS",
				summary: "Set Performance benchmark sign-off to at-risk",
				rationale: "The due date passed while work is still not-started.",
				basis: "Performance sign-off is overdue",
				taskId: "task-performance-benchmark-signoff",
				newStatus: "at-risk",
			},
			{
				id: "op-elapsed-performance-move-date",
				type: "MOVE_TASK_DATE",
				summary: "Move Performance benchmark sign-off due date to next week",
				rationale: "A revised date makes the risk explicit and actionable.",
				basis: "Need realistic near-term benchmark date",
				taskId: "task-performance-benchmark-signoff",
				newDueDate: "2026-06-30",
			},
		],
	},
	"signal-success-criteria-overdue": {
		signalSummary:
			"Success-criteria alignment is overdue and threatens upstream alignment quality.",
		reasoning:
			"Discovery alignment drives downstream execution, so mark risk and set a concrete near-term due date.",
		operations: [
			{
				id: "op-elapsed-success-criteria-date",
				type: "MOVE_TASK_DATE",
				summary: "Move success-criteria confirmation due date by one week",
				rationale:
					"The current due date is no longer realistic given the overrun.",
				basis: "Success-criteria task is overdue",
				taskId: "task-confirm-success-criteria",
				newDueDate: "2026-07-01",
			},
			{
				id: "op-elapsed-success-criteria-risk",
				type: "CHANGE_TASK_STATUS",
				summary: "Set success-criteria confirmation to at-risk",
				rationale: "Five days overdue indicates elevated delivery risk.",
				basis: "Five-day delay increases delivery risk",
				taskId: "task-confirm-success-criteria",
				newStatus: "at-risk",
			},
		],
	},
};
