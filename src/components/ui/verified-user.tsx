"use client";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";

export default function VerifiedUser() {
	const [hovered, setHovered] = useState(false);

	return (
		<>
			<BadgeCheck
				onMouseOver={() => setHovered(true)}
				onMouseOut={() => setHovered(false)}
				className="size-4 relative"
				color="#00b3ff"
			/>
			<div
				className={`
					bg-[#00b3ff] text-white font-semibold text-xs absolute translate-x-18
					transition-all duration-200 py-1 px-2 rounded-sm
					${hovered ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 pointer-events-none"}
				`}
			>
				Utilisateur vérifié
				<div
					className="absolute -left-1.5 bottom-2.5"
					style={{
						width: 0,
						height: 0,
						borderLeft: "8px solid transparent",
						borderRight: "2px solid transparent",
						borderTop: "8px solid #00b3ff",
					}}
				/>
			</div>
		</>
	);
}
