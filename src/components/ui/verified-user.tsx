"use client";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";

/**
 * Affiche une icône utilisateur vérifié avec un tooltip
 * Le tooltip est toujours positionné de façon absolue par rapport à la page (viewport)
 */
export default function VerifiedUser() {
	const [hovered, setHovered] = useState(false);

	return (
		<span style={{ position: "relative", display: "inline-block" }}>
			<BadgeCheck
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				className="size-4"
				color="#00b3ff"
			/>
			{hovered && (
				<div
					style={{
						position: "absolute",
						top: "120%",
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 9999,
						whiteSpace: "nowrap",
					}}
					className={`
					bg-[#00b3ff] text-white font-semibold text-xs
					transition-all duration-200 py-1 px-2 rounded-sm
					opacity-100 pointer-events-auto
					shadow-lg
				`}
				>
					Utilisateur vérifié
					<div
						className="absolute"
						style={{
							left: "50%",
							transform: "translateX(-50%)",
							top: "-20%",
							width: 0,
							height: 0,
						}}
					/>
				</div>
			)}
		</span>
	);
}
