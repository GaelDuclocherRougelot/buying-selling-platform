"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Copy,
	Eye,
	Package,
	Truck,
} from "lucide-react";
import { useState } from "react";

interface TrackingEvent {
	date: string;
	status: string;
	location?: string;
	description: string;
}

interface TrackingData {
	carrier: string;
	trackingNumber: string;
	status: string;
	events: TrackingEvent[];
	isDelivered: boolean;
	isInTransit: boolean;
	estimatedDelivery?: string;
	actualDelivery?: string;
	simulated: boolean;
}

interface ShippingTrackerProps {
	paymentId: string;
	trackingNumber?: string;
}

export default function ShippingTracker({
	paymentId,
	trackingNumber,
}: ShippingTrackerProps) {
	const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTrackingNumber, setShowTrackingNumber] = useState(false);

	// Simuler le suivi
	const fetchTracking = async (trackingNum: string) => {
		setLoading(true);
		setError(null);

		try {
			const response = await apiFetch("/api/shipping/tracking", {
				method: "POST",
				body: JSON.stringify({
					paymentId,
					trackingNumber: trackingNum,
				}),
			});

			if (!response.ok) {
				throw new Error("Erreur lors du suivi");
			}

			const data = await response.json();
			setTrackingData(data.tracking);
		} catch (err) {
			setError("Impossible de récupérer le suivi");
			console.error("Erreur tracking:", err);
		} finally {
			setLoading(false);
		}
	};

	// Générer un numéro de suivi simulé
	const generateTrackingNumber = () => {
		const carriers = [
			{
				name: "La Poste",
				format: () =>
					`${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
			},
			{
				name: "Chronopost",
				format: () =>
					`${Math.floor(Math.random() * 9000000000) + 1000000000}`,
			},
			{
				name: "DHL",
				format: () =>
					`${Math.floor(Math.random() * 9000000000) + 1000000000}`,
			},
		];

		const carrier = carriers[Math.floor(Math.random() * carriers.length)];
		return carrier.format();
	};

	// Démarrer le suivi
	const startTracking = () => {
		const trackingNum = trackingNumber || generateTrackingNumber();
		fetchTracking(trackingNum);
	};

	// Copier le numéro de suivi
	const copyTrackingNumber = () => {
		if (trackingData?.trackingNumber) {
			navigator.clipboard.writeText(trackingData.trackingNumber);
		}
	};

	// Calculer la progression
	const getProgress = () => {
		if (!trackingData) return 0;

		const totalEvents = trackingData.events.length;
		const deliveredEvents = trackingData.events.filter(
			(e) => e.status.includes("DELIVERED") || e.status.includes("LIV")
		).length;

		return Math.min(
			(deliveredEvents / Math.max(totalEvents, 1)) * 100,
			100
		);
	};

	// Obtenir le statut visuel
	const getStatusIcon = () => {
		if (!trackingData) return <Clock className="h-4 w-4" />;

		if (trackingData.isDelivered)
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		if (trackingData.isInTransit)
			return <Truck className="h-4 w-4 text-blue-500" />;
		return <Package className="h-4 w-4 text-gray-500" />;
	};

	// Obtenir la couleur du badge
	const getStatusColor = () => {
		if (!trackingData) return "secondary";
		if (trackingData.isDelivered) return "default";
		if (trackingData.isInTransit) return "outline";
		return "secondary";
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{getStatusIcon()}
						Suivi de Livraison
						{trackingData?.simulated && (
							<Badge variant="outline" className="text-xs">
								Simulation
							</Badge>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{!trackingData ? (
						<div className="text-center space-y-4">
							<p className="text-muted-foreground">
								Aucun suivi en cours. Cliquez pour démarrer la
								simulation.
							</p>
							<Button onClick={startTracking} disabled={loading}>
								{loading
									? "Chargement..."
									: "Démarrer le Suivi"}
							</Button>
						</div>
					) : (
						<>
							{/* Informations générales */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Transporteur
									</p>
									<Badge variant="outline">
										{trackingData.carrier}
									</Badge>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Statut
									</p>
									<Badge variant={getStatusColor()}>
										{trackingData.status === "delivered"
											? "Livré"
											: trackingData.status ===
												  "in_transit"
												? "En transit"
												: "En attente"}
									</Badge>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Numéro de suivi
									</p>
									<div className="flex items-center gap-2">
										<code className="text-sm bg-muted px-2 py-1 rounded">
											{showTrackingNumber
												? trackingData.trackingNumber
												: "••••••••••••"}
										</code>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												setShowTrackingNumber(
													!showTrackingNumber
												)
											}
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={copyTrackingNumber}
										>
											<Copy className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>

							{/* Barre de progression */}
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Progression</span>
									<span>{Math.round(getProgress())}%</span>
								</div>
								<Progress
									value={getProgress()}
									className="h-2"
								/>
							</div>

							{/* Événements de suivi */}
							<div className="space-y-3">
								<h4 className="font-medium">Événements</h4>
								<div className="space-y-2">
									{trackingData.events.map((event, index) => (
										<div
											key={index}
											className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
										>
											<div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
											<div className="flex-1 space-y-1">
												<p className="text-sm font-medium">
													{event.description}
												</p>
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													<span>
														{event.location}
													</span>
													<span>
														{new Date(
															event.date
														).toLocaleString()}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Informations de livraison */}
							{(trackingData.estimatedDelivery ||
								trackingData.actualDelivery) && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
									{trackingData.estimatedDelivery && (
										<div>
											<p className="text-sm font-medium">
												Livraison estimée
											</p>
											<p className="text-sm text-muted-foreground">
												{new Date(
													trackingData.estimatedDelivery
												).toLocaleDateString()}
											</p>
										</div>
									)}
									{trackingData.actualDelivery && (
										<div>
											<p className="text-sm font-medium">
												Livraison effective
											</p>
											<p className="text-sm text-muted-foreground">
												{new Date(
													trackingData.actualDelivery
												).toLocaleDateString()}
											</p>
										</div>
									)}
								</div>
							)}
						</>
					)}

					{error && (
						<div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
							<AlertCircle className="h-4 w-4 text-destructive" />
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
