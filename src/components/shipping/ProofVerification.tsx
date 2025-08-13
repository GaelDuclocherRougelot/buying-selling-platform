"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	Eye,
	FileText,
	Package,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ProofData {
	trackingNumber: string;
	receiptImageUrl: string;
	packageImageUrl: string;
	description?: string;
}

interface ShippingProof {
	id: string;
	paymentId: string;
	proofType: string;
	proofData: ProofData;
	status: "pending_verification" | "verified" | "rejected";
	submittedAt: string;
	verifiedAt?: string;
	verifiedBy?: string;
}

interface ProofVerificationProps {
	paymentId: string;
}

export default function ProofVerification({
	paymentId,
}: ProofVerificationProps) {
	const [proof, setProof] = useState<ShippingProof | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showImages, setShowImages] = useState(false);

	// Charger les preuves d'expédition
	const loadProof = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await apiFetch(
				`/api/shipping/proof?paymentId=${paymentId}`,
				{
					method: "GET",
				}
			);

			if (response.ok) {
				const data = await response.json();
				setProof(data.proof);
			} else {
				// Simuler une preuve si aucune n'existe
				setProof({
					id: "proof-simulated",
					paymentId,
					proofType: "complete_proof",
					proofData: {
						trackingNumber: "1234567890123",
						receiptImageUrl: "/images/sample-receipt.jpg",
						packageImageUrl: "/images/sample-package.jpg",
						description: "Colis expédié via La Poste",
					},
					status: "pending_verification",
					submittedAt: new Date().toISOString(),
				});
			}
		} catch {
			setError("Impossible de charger les preuves");
			console.error("Erreur chargement preuves");
		} finally {
			setLoading(false);
		}
	}, [paymentId]);

	// Simuler la vérification (admin)
	const simulateVerification = async (status: "verified" | "rejected") => {
		setLoading(true);

		try {
			const response = await apiFetch(
				`/api/admin/shipping-proofs/${proof?.id}/verify`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ status }),
				}
			);

			if (response.ok) {
				// Recharger les preuves
				await loadProof();
			}
		} catch {
			setError("Erreur lors de la vérification");
		} finally {
			setLoading(false);
		}
	};

	// Obtenir le statut visuel
	const getStatusIcon = () => {
		if (!proof) return <Clock className="h-4 w-4" />;

		switch (proof.status) {
			case "verified":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "rejected":
				return <XCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Clock className="h-4 w-4 text-yellow-500" />;
		}
	};

	// Obtenir la couleur du badge
	const getStatusColor = () => {
		if (!proof) return "secondary";

		switch (proof.status) {
			case "verified":
				return "default";
			case "rejected":
				return "destructive";
			default:
				return "outline";
		}
	};

	// Obtenir le texte du statut
	const getStatusText = () => {
		if (!proof) return "Aucune preuve";

		switch (proof.status) {
			case "verified":
				return "Validée";
			case "rejected":
				return "Rejetée";
			default:
				return "En attente de vérification";
		}
	};

	useEffect(() => {
		loadProof();
	}, [paymentId, loadProof]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{getStatusIcon()}
						Vérification des Preuves d&apos;Expédition
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								Chargement...
							</p>
						</div>
					) : !proof ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								Aucune preuve d&apos;expédition trouvée
							</p>
						</div>
					) : (
						<>
							{/* Statut de la preuve */}
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<p className="text-sm font-medium">
										Statut de la preuve
									</p>
									<Badge variant={getStatusColor()}>
										{getStatusText()}
									</Badge>
								</div>
								<div className="text-sm text-muted-foreground">
									Soumise le{" "}
									{new Date(
										proof.submittedAt
									).toLocaleDateString()}
								</div>
							</div>

							{/* Numéro de suivi */}
							<div className="space-y-2">
								<p className="text-sm font-medium">
									Numéro de suivi
								</p>
								<div className="flex items-center gap-2">
									<code className="text-sm bg-muted px-2 py-1 rounded">
										{proof.proofData.trackingNumber}
									</code>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											navigator.clipboard.writeText(
												proof.proofData.trackingNumber
											)
										}
									>
										<Eye className="h-4 w-4" />
									</Button>
								</div>
							</div>

							{/* Description */}
							{proof.proofData.description && (
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Description
									</p>
									<p className="text-sm text-muted-foreground">
										{proof.proofData.description}
									</p>
								</div>
							)}

							{/* Images des preuves */}
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<p className="text-sm font-medium">
										Preuves visuelles
									</p>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setShowImages(!showImages)
										}
									>
										{showImages ? "Masquer" : "Afficher"}
									</Button>
								</div>

								{showImages && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<FileText className="h-4 w-4" />
												<span className="text-sm font-medium">
													Reçu d&apos;affranchissement
												</span>
											</div>
											<div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
												<p className="text-sm text-muted-foreground">
													Image du reçu
												</p>
											</div>
										</div>

										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<Package className="h-4 w-4" />
												<span className="text-sm font-medium">
													Photo du colis
												</span>
											</div>
											<div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
												<p className="text-sm text-muted-foreground">
													Image du colis
												</p>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Actions admin (simulation) */}
							{proof.status === "pending_verification" && (
								<div className="flex items-center gap-4 pt-4 border-t">
									<div className="flex items-center gap-2">
										<AlertTriangle className="h-4 w-4 text-yellow-500" />
										<span className="text-sm text-muted-foreground">
											Simulation : Actions admin
										</span>
									</div>
									<div className="flex gap-2">
										<Button
											size="sm"
											onClick={() =>
												simulateVerification("verified")
											}
											disabled={loading}
										>
											Valider
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() =>
												simulateVerification("rejected")
											}
											disabled={loading}
										>
											Rejeter
										</Button>
									</div>
								</div>
							)}

							{/* Informations de vérification */}
							{proof.verifiedAt && (
								<div className="pt-4 border-t">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<p className="text-sm font-medium">
												Vérifié le
											</p>
											<p className="text-sm text-muted-foreground">
												{new Date(
													proof.verifiedAt
												).toLocaleDateString()}
											</p>
										</div>
										{proof.verifiedBy && (
											<div>
												<p className="text-sm font-medium">
													Vérifié par
												</p>
												<p className="text-sm text-muted-foreground">
													{proof.verifiedBy}
												</p>
											</div>
										)}
									</div>
								</div>
							)}
						</>
					)}

					{error && (
						<div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
							<AlertTriangle className="h-4 w-4 text-destructive" />
							<p className="text-sm text-destructive">{error}</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
