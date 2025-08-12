"use client";

import { useMessages } from "@/lib/hooks/useMessages";

export default function MessageStatus() {
	const { loading, sending } = useMessages();

	return (
		<div className="flex items-center space-x-2 text-sm">
			{loading && (
				<div className="flex items-center space-x-1 text-blue-600">
					<div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
					<span>Chargement...</span>
				</div>
			)}
			{sending && (
				<div className="flex items-center space-x-1 text-orange-600">
					<div className="animate-spin rounded-full h-3 w-3 border-b border-orange-600"></div>
					<span>Envoi...</span>
				</div>
			)}
		</div>
	);
}
