import { getOwnerAvatar } from "@/lib/ownerAvatar";

type OwnerBadgeProps = {
	owner: string;
	textSizeClass?: string;
};

export function OwnerBadge({
	owner,
	textSizeClass = "text-sm",
}: OwnerBadgeProps) {
	const avatar = getOwnerAvatar(owner);

	return (
		<span
			className={`inline-flex items-center gap-2 ${textSizeClass} text-slate-700`}
		>
			<span
				className="inline-flex h-6 w-6 items-center justify-center rounded-full"
				style={{
					backgroundColor: avatar.backgroundColor,
					color: avatar.textColor,
				}}
				aria-hidden="true"
			>
				{avatar.animal}
			</span>
			<span>{owner}</span>
		</span>
	);
}
