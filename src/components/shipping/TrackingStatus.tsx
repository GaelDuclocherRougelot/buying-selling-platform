"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	AlertCircle,
	Calendar,
	CheckCircle,
	Clock,
	Copy,
	Eye,
	Package,
	Truck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TrackingStatusProps {
	paymentId: string;
	initialTrackingNumber?: string;
}

interface TrackingData {
	tracking: {
		id: string;
		trackingNumber: string;
		status: {
			code: string;
			libelle: string;
			etape: number | null;
			description: string;
			isDelivered: boolean;
			isInTransit: boolean;
			isFailed: boolean;
		};
		lastEventCode: string;
		lastEventLabel: string;
		lastEventDate: string;
		timeline: {
			date: string;
			status: string;
			location?: string;
			description: string;
		}[];
		events: {
			date: string;
			status: string;
			location?: string;
			description: string;
		}[];
	};
	isDelivered: boolean;
	currentStep: number | null;
	stepLabel: string | null;
}

interface ShippingProof {
	id: string;
	proofType: string;
	proofData: {
		trackingNumber?: string;
		receiptImageUrl?: string;
		packageImageUrl?: string;
		description?: string;
	};
	status: string;
	submittedAt: string;
	verifiedAt?: string;
}

export default function TrackingStatus({
	paymentId,
	initialTrackingNumber,
}: TrackingStatusProps) {
	const [trackingNumber, setTrackingNumber] = useState(
		initialTrackingNumber || ""
	);
	const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
	const [shippingProof, setShippingProof] = useState<ShippingProof | null>(
		null
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showTrackingNumber, setShowTrackingNumber] = useState(false);

	const fetchTracking = useCallback(
		async (number?: string) => {
			const trackingNum = number || trackingNumber.trim();
			if (!trackingNum) {
				setError("Veuillez saisir un numéro de suivi");
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/shipping/tracking", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						paymentId,
						trackingNumber: trackingNum,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Erreur lors du suivi");
				}

				const data = await response.json();
				setTrackingData(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Erreur inconnue"
				);
			} finally {
				setLoading(false);
			}
		},
		[paymentId, trackingNumber]
	);

	// Récupérer automatiquement le numéro de suivi depuis la preuve d'expédition
	useEffect(() => {
		const fetchShippingProof = async () => {
			try {
				const response = await fetch(
					`/api/shipping/proof?paymentId=${paymentId}`
				);
				if (response.ok) {
					const data = await response.json();
					if (data.proof && data.proof.proofData.trackingNumber) {
						setShippingProof(data.proof);
						setTrackingNumber(data.proof.proofData.trackingNumber);
						// Automatiquement récupérer le suivi si la preuve est validée
						if (data.proof.status === "verified") {
							fetchTracking(data.proof.proofData.trackingNumber);
						}
					}
				}
			} catch (err) {
				console.error(
					"Erreur lors de la récupération de la preuve:",
					err
				);
			}
		};

		fetchShippingProof();
	}, [paymentId, fetchTracking]);

	const copyTrackingNumber = async () => {
		if (trackingNumber) {
			try {
				await navigator.clipboard.writeText(trackingNumber);
				// Optionnel : afficher un toast de confirmation
			} catch (err) {
				console.error("Erreur lors de la copie:", err);
			}
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "delivered":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "in_transit":
				return <Truck className="h-5 w-5 text-blue-500" />;
			case "failed":
				return <AlertCircle className="h-5 w-5 text-red-500" />;
			default:
				return <Clock className="h-5 w-5 text-gray-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "delivered":
				return "bg-green-100 text-green-800";
			case "in_transit":
				return "bg-blue-100 text-blue-800";
			case "failed":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getProgressValue = (currentStep: number | null) => {
		if (!currentStep) return 0;
		return (currentStep / 5) * 100;
	};

	const getProofStatusColor = (status: string) => {
		switch (status) {
			case "verified":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-orange-100 text-orange-800";
		}
	};

	const getProofStatusLabel = (status: string) => {
		switch (status) {
			case "verified":
				return "Validée";
			case "rejected":
				return "Rejetée";
			default:
				return "En attente de vérification";
		}
	};

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Package className="h-5 w-5" />
					Suivi du colis
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Statut de la preuve d'expédition */}
				{shippingProof && (
					<div className="p-4 border rounded-lg">
						<div className="flex items-center justify-between mb-2">
							<h4 className="font-medium">
								Preuve d&apos;expédition
							</h4>
							<Badge
								className={getProofStatusColor(
									shippingProof.status
								)}
							>
								{getProofStatusLabel(shippingProof.status)}
							</Badge>
						</div>
						<p className="text-sm text-gray-600">
							Soumise le{" "}
							{new Date(
								shippingProof.submittedAt
							).toLocaleDateString("fr-FR")}
						</p>

						{/* Numéro de suivi (si preuve validée) */}
						{shippingProof.status === "verified" &&
							shippingProof.proofData.trackingNumber && (
								<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-sm font-medium text-blue-800">
												Numéro de suivi disponible
											</p>
											<p className="text-xs text-blue-600">
												Le vendeur a soumis sa preuve
												d&apos;expédition
											</p>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setShowTrackingNumber(
														!showTrackingNumber
													)
												}
											>
												<Eye className="h-4 w-4" />
												{showTrackingNumber
													? "Masquer"
													: "Voir"}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={copyTrackingNumber}
											>
												<Copy className="h-4 w-4" />
												Copier
											</Button>
										</div>
									</div>
									{showTrackingNumber && (
										<div className="mt-2 p-2 bg-white border rounded">
											<code className="text-sm font-mono">
												{
													shippingProof.proofData
														.trackingNumber
												}
											</code>
										</div>
									)}
								</div>
							)}
					</div>
				)}

				{/* Saisie manuelle du numéro de suivi (si pas de preuve validée) */}
				{(!shippingProof || shippingProof.status !== "verified") && (
					<div className="space-y-2">
						<Label htmlFor="trackingNumber">
							Numéro de suivi Colissimo
						</Label>
						<div className="flex gap-2">
							<Input
								id="trackingNumber"
								value={trackingNumber}
								onChange={(e) =>
									setTrackingNumber(e.target.value)
								}
								placeholder="Ex: 1A2B3C4D5E6F"
								className="flex-1"
							/>
							<Button
								onClick={() => fetchTracking()}
								disabled={loading}
							>
								{loading ? "Vérification..." : "Vérifier"}
							</Button>
						</div>
						{(!shippingProof ||
							shippingProof.status !== "verified") && (
							<p className="text-xs text-gray-500">
								Le numéro de suivi sera disponible une fois la
								preuve d&apos;expédition validée par le vendeur.
							</p>
						)}
					</div>
				)}

				{error && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-md">
						<p className="text-red-600 text-sm">{error}</p>
					</div>
				)}

				{/* Affichage du statut */}
				{trackingData && (
					<div className="space-y-4">
						{/* Statut principal */}
						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-3">
								{getStatusIcon(
									trackingData.tracking.status.code
								)}
								<div>
									<h3 className="font-semibold">
										{trackingData.tracking.status.libelle}
									</h3>
									<p className="text-sm text-gray-600">
										{
											trackingData.tracking.status
												.description
										}
									</p>
								</div>
							</div>
							<Badge
								className={getStatusColor(
									trackingData.tracking.status.code
								)}
							>
								{trackingData.tracking.status.code ===
									"delivered" && "Livré"}
								{trackingData.tracking.status.code ===
									"in_transit" && "En transit"}
								{trackingData.tracking.status.code ===
									"failed" && "Problème"}
								{trackingData.tracking.status.code ===
									"pending" && "En attente"}
							</Badge>
						</div>

						{/* Progression */}
						{trackingData.currentStep && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Progression</span>
									<span>{trackingData.stepLabel}</span>
								</div>
								<Progress
									value={getProgressValue(
										trackingData.currentStep
									)}
								/>
								<div className="flex justify-between text-xs text-gray-500">
									<span>Préparation</span>
									<span>Prise en charge</span>
									<span>Traitement</span>
									<span>Distribution</span>
									<span>Livraison</span>
								</div>
							</div>
						)}

						{/* Dernier événement */}
						<div className="p-4 border rounded-lg">
							<h4 className="font-medium mb-2">
								Dernier événement
							</h4>
							<div className="flex items-center gap-2 text-sm">
								<Calendar className="h-4 w-4 text-gray-500" />
								<span>
									{new Date(
										trackingData.tracking.lastEventDate
									).toLocaleDateString("fr-FR", {
										day: "numeric",
										month: "long",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							<p className="mt-1 text-sm text-gray-600">
								{trackingData.tracking.lastEventLabel}
							</p>
						</div>

						{/* Informations de paiement */}
						{trackingData.isDelivered && (
							<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
								<div className="flex items-center gap-2">
									<CheckCircle className="h-5 w-5 text-green-600" />
									<span className="font-medium text-green-800">
										Colis livré ! Le paiement a été
										transféré au vendeur.
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
