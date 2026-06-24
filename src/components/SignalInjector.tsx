import { useState } from "react";
import { Button } from "./Button";
import { InfoTooltip } from "./InfoTooltip";

type SignalInjectorProps = {
	examples: string[];
	onSubmit: (payload: { content: string }) => void;
};

export function SignalInjector({ examples, onSubmit }: SignalInjectorProps) {
	const [content, setContent] = useState("");
	const [nextExampleIndex, setNextExampleIndex] = useState(0);

	return (
		<section>
			<h2 className="mb-2 flex items-center gap-1.5 text-base font-semibold text-slate-900">
				Inject custom signal
				<InfoTooltip label="How does injecting a custom signal work?">
					<span className="block">
						Type any new fact about the deal the engine has never seen. It
						always calls the live AI (no cached fallback) — this is the proof
						the AI genuinely reasons, rather than replaying canned answers. If
						the API is unavailable it shows an honest error. The AI now infers
						the signal source from your text (for example: Transcript,
						Engagement, Elapsed time, Document upload, or Assignee change).
					</span>
					<span className="mt-2 block border-t border-slate-200 pt-2 text-slate-500">
						<strong>Example</strong> — text:
						<span className="mt-1 block rounded bg-slate-50 p-1.5 italic text-slate-700">
							“On today’s call the buyer’s CISO said security review can’t start
							until their SOC 2 audit finishes end of August, and they want
							legal looped in earlier.”
						</span>
						<span className="mt-1 block">
							The AI might propose moving the security-review date, adding a
							task to involve legal, and flagging a dependent milestone at-risk
							— each for you to approve or reject.
						</span>
					</span>
				</InfoTooltip>
			</h2>
			<div className="space-y-2">
				<textarea
					value={content}
					onChange={(event) => setContent(event.target.value)}
					rows={3}
					placeholder="Type a new signal the engine has never seen..."
					className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
				/>
				<div className="flex flex-wrap gap-2">
					<Button
						variant="secondary"
						onClick={() => {
							if (examples.length === 0) {
								return;
							}

							setContent(examples[nextExampleIndex]);
							setNextExampleIndex((index) => (index + 1) % examples.length);
						}}
						disabled={examples.length === 0}
					>
						✨ Inspire me
					</Button>
					<Button
						variant="primary"
						disabled={content.trim().length === 0}
						onClick={() => {
							const trimmed = content.trim();
							if (!trimmed) {
								return;
							}

							onSubmit({ content: trimmed });
							setContent("");
						}}
					>
						Inject signal
					</Button>
				</div>
			</div>
		</section>
	);
}
