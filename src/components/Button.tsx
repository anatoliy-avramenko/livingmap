import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary" | "approve" | "reject";
};

const baseClassName =
	"inline-flex items-center justify-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed";

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
	primary:
		"bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400",
	secondary:
		"border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:bg-slate-100 disabled:text-slate-400",
	approve:
		"border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
	reject:
		"border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
};

export function Button({
	variant = "secondary",
	className,
	type,
	...props
}: ButtonProps) {
	return (
		<button
			type={type ?? "button"}
			className={`${baseClassName} ${variantClasses[variant]} ${className ?? ""}`}
			{...props}
		/>
	);
}
