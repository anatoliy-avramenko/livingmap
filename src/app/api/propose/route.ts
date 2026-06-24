import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
	PROPOSAL_TOOL_NAME,
	proposalTool,
	sanitizeToolResponse,
} from "@/lib/proposalTool";
import type { Milestone, Signal, Task } from "@/lib/types";

export const runtime = "nodejs";

const CLAUDE_MODEL = "claude-sonnet-4-5";

type ProposeRequest = {
	signal: Signal;
	map: {
		milestones: Array<Pick<Milestone, "id" | "title" | "order">>;
		tasks: Array<
			Pick<
				Task,
				"id" | "milestoneId" | "title" | "owner" | "dueDate" | "status"
			>
		>;
	};
	mode: "live";
};

function getToolInput(message: Anthropic.Messages.Message): unknown {
	const toolUseBlock = message.content.find(
		(block) => block.type === "tool_use" && block.name === PROPOSAL_TOOL_NAME,
	);

	if (toolUseBlock?.type !== "tool_use") {
		return null;
	}

	return toolUseBlock.input;
}

export async function POST(request: Request) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: "ANTHROPIC_API_KEY is not configured" },
			{ status: 503 },
		);
	}

	let body: ProposeRequest;

	try {
		body = (await request.json()) as ProposeRequest;
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON request body" },
			{ status: 400 },
		);
	}

	if (
		!body?.signal ||
		!body?.map ||
		!Array.isArray(body.map.milestones) ||
		!Array.isArray(body.map.tasks)
	) {
		return NextResponse.json(
			{ error: "Missing required signal/map payload" },
			{ status: 400 },
		);
	}

	try {
		const anthropic = new Anthropic({ apiKey });

		const response = await anthropic.messages.create({
			model: CLAUDE_MODEL,
			max_tokens: 1500,
			system:
				"You are a Mutual Action Plan assistant in a Digital Sales Room. You receive the current MAP and one new Signal. Propose only minimal, justified MAP changes caused by that Signal. Use real ids from the MAP snapshot when targeting existing Tasks or Milestones. Use at-risk for threatened work and blocked for work that cannot proceed. For each operation, include basis: a SUPER-BRIEF explanation (under 10 words) of why this specific change is warranted by the signal (for example Budget approval slipped to Q3, SOC2 review blocks security task, No engagement for nine days). basis is distinct from summary and rationale. Also return inferredSource: a short human-readable classification of the signal kind inferred from signal text (for example Transcript, Engagement, Elapsed time, Document upload, Assignee change). inferredSource is open vocabulary and must match the text evidence.",
			messages: [
				{
					role: "user",
					content: JSON.stringify({
						map: body.map,
						signal: body.signal,
					}),
				},
			],
			tools: [proposalTool],
			tool_choice: { type: "tool", name: PROPOSAL_TOOL_NAME },
		});

		const rawInput = getToolInput(response);
		const proposalResponse = sanitizeToolResponse(rawInput, body.map);

		return NextResponse.json(proposalResponse);
	} catch {
		return NextResponse.json(
			{ error: "Failed to generate proposal" },
			{ status: 500 },
		);
	}
}
