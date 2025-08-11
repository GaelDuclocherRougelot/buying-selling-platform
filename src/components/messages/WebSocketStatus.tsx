"use client";
import { useWebSocket } from "@/lib/hooks/useWebSocket";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export default function WebSocketStatus() {
	const { isConnected, isConnecting } = useWebSocket();

	if (isConnecting) {
		return (
			<div className="flex items-center space-x-2 text-yellow-600">
				<Loader2 className="w-4 h-4 animate-spin" />
				<span className="text-sm">Connexion en cours...</span>
			</div>
		);
	}

	if (isConnected) {
		return (
			<div className="flex items-center space-x-2 text-green-600">
				<Wifi className="w-4 h-4" />
				<span className="text-sm">Connecté</span>
			</div>
		);
	}

	return (
		<div className="flex items-center space-x-2 text-red-600">
			<WifiOff className="w-4 h-4" />
			<span className="text-sm">Déconnecté</span>
		</div>
	);
}
