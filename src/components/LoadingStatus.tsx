"use client";

import { useEffect, useState } from "react";

const STATUSES = [
	"Reading the room…",
	"Consulting the buying committee…",
	"Reconciling the close plan…",
	"Checking who went dark…",
	"Re-sequencing milestones…",
	"Weighing the champion's leverage…",
	"Aligning seller and buyer owners…",
	"Scanning overdue commitments…",
	"Cross-checking procurement momentum…",
	"Pressure-testing timeline risk…",
	"Rebalancing technical validation…",
	"Linking signals to MAP changes…",
	"Prioritizing unblockers for this deal…",
	"Reticulating the pipeline…",
	"Drafting proposal operations…",
] as const;

export function LoadingStatus() {
	const [statusIndex, setStatusIndex] = useState(0);

	useEffect(() => {
		const intervalId = window.setInterval(() => {
			setStatusIndex((current) => (current + 1) % STATUSES.length);
		}, 2400);

		return () => {
			window.clearInterval(intervalId);
		};
	}, []);

	return (
		<div>
			<div className="flex items-center gap-3">
				<svg
					viewBox="0 0 120 40"
					className="h-8 w-20"
					role="img"
					aria-label="Generating proposal"
				>
					<title>Generating proposal</title>
					<circle cx="20" cy="20" r="6" fill="#4f46e5">
						<animate
							attributeName="opacity"
							values="0.25;1;0.25"
							dur="1.2s"
							repeatCount="indefinite"
						/>
					</circle>
					<circle cx="60" cy="20" r="6" fill="#4f46e5">
						<animate
							attributeName="opacity"
							values="0.25;1;0.25"
							dur="1.2s"
							begin="0.2s"
							repeatCount="indefinite"
						/>
					</circle>
					<circle cx="100" cy="20" r="6" fill="#4f46e5">
						<animate
							attributeName="opacity"
							values="0.25;1;0.25"
							dur="1.2s"
							begin="0.4s"
							repeatCount="indefinite"
						/>
					</circle>
				</svg>
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">
						Generating proposal
					</p>
					<p className="text-sm text-indigo-900">{STATUSES[statusIndex]}</p>
				</div>
			</div>
		</div>
	);
}
