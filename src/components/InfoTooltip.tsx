"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

type InfoTooltipProps = {
	label: string;
	children: ReactNode;
	variant?: "subtle" | "prominent";
};

const triggerStyles: Record<
	NonNullable<InfoTooltipProps["variant"]>,
	string
> = {
	subtle:
		"h-4 w-4 text-[10px] border-slate-400 text-slate-500 hover:border-slate-600 hover:text-slate-700",
	prominent:
		"h-6 w-6 text-xs border-indigo-400 bg-indigo-100 text-indigo-700 hover:border-indigo-600 hover:bg-indigo-200 hover:text-indigo-900",
};

/**
 * A "?" affordance that reveals explanatory help on hover or keyboard focus.
 * `subtle` is the small inline control; `prominent` is a larger, coloured badge
 * for headings. Pure Tailwind, no deps.
 */
export function InfoTooltip({
	label,
	children,
	variant = "subtle",
}: InfoTooltipProps) {
	const [isOpen, setIsOpen] = useState(false);
	const tooltipId = useId();

	return (
		<span className="relative inline-flex">
			<button
				type="button"
				aria-label={label}
				aria-describedby={isOpen ? tooltipId : undefined}
				onMouseEnter={() => setIsOpen(true)}
				onMouseLeave={() => setIsOpen(false)}
				onFocus={() => setIsOpen(true)}
				onBlur={() => setIsOpen(false)}
				className={`flex items-center justify-center rounded-full border font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${triggerStyles[variant]}`}
			>
				?
			</button>
			{isOpen ? (
				<span
					id={tooltipId}
					role="tooltip"
					className="absolute left-1/2 top-6 z-20 w-72 -translate-x-1/2 animate-fade-in-tooltip rounded-md border border-slate-200 bg-white p-3 text-left text-xs font-normal leading-relaxed text-slate-600 shadow-lg"
				>
					{children}
				</span>
			) : null}
		</span>
	);
}
