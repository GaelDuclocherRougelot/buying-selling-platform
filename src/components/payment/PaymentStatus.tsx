"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	DollarSign,
	Package,
	Truck,
	User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Payment {
	id: string;
	amount: number;
	currency: string;
	status: "pending" | "succeeded" | "failed" | "canceled";
	productId: string;
	buyerId: string;
	sellerId: string;
	applicationFeeAmount?: number;
	createdAt: string;
	updatedAt: string;
	product: {
		title: string;
		price: number;
	};
	buyer: {
		name: string;
		email: string;
	};
	seller: {
		name: string;
		email: string;
		stripeAccountId?: string;
	};
	shipmentTracking?: {
		trackingNumber: string;
		status: string;
		isDelivered: boolean;
	};
}

interface PaymentStatusProps {
	paymentId: string;
}

export default function PaymentStatus({ paymentId }: PaymentStatusProps) {
	const [payment, setPayment] = useState<Payment | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Obtenir le statut visuel
	const getStatusIcon = () => {
		if (!payment) return <Clock className="h-4 w-4" />;

		switch (payment.status) {
			case "succeeded":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			case "canceled":
				return <AlertCircle className="h-4 w-4 text-orange-500" />;
			default:
				return <Clock className="h-4 w-4 text-yellow-500" />;
		}
	};

	// Obtenir la couleur du badge
	const getStatusColor = () => {
		if (!payment) return "secondary";

		switch (payment.status) {
			case "succeeded":
				return "default";
			case "failed":
				return "destructive";
			case "canceled":
				return "secondary";
			default:
				return "outline";
		}
	};

	// Obtenir le texte du statut
	const getStatusText = () => {
		if (!payment) return "Chargement...";

		switch (payment.status) {
			case "succeeded":
				return "Transféré au vendeur";
			case "failed":
				return "Échec du paiement";
			case "canceled":
				return "Paiement annulé";
			default:
				return "En attente de livraison";
		}
	};

	// Calculer le montant transféré
	const getTransferAmount = () => {
		if (!payment) return 0;
		return payment.amount - (payment.applicationFeeAmount || 0);
	};
	const loadPayment = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/payments/${paymentId}`);

			if (response.ok) {
				const data = await response.json();
				setPayment(data.payment);
			} else {
				// Simuler un paiement si aucun n'existe
				setPayment({
					id: paymentId,
					amount: 150.0,
					currency: "eur",
					status: "pending",
					productId: "product-123",
					buyerId: "buyer-123",
					sellerId: "seller-456",
					applicationFeeAmount: 7.5,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					product: {
						title: "Table à manger en bois",
						price: 150.0,
					},
					buyer: {
						name: "Jean Dupont",
						email: "jean.dupont@email.com",
					},
					seller: {
						name: "Marie Martin",
						email: "marie.martin@email.com",
						stripeAccountId: "acct_seller123",
					},
					shipmentTracking: {
						trackingNumber: "1234567890123",
						status: "in_transit",
						isDelivered: false,
					},
				});
			}
		} catch (err) {
			setError("Impossible de charger les informations de paiement");
			console.error("Erreur chargement paiement:", err);
		} finally {
			setLoading(false);
		}
	}, [paymentId]);

	useEffect(() => {
		// Charger les informations de paiement
		loadPayment();
	}, [paymentId, loadPayment]);

	// Simuler le transfert automatique
	const simulateTransfer = async () => {
		if (!payment || payment.status !== "pending") return;

		setLoading(true);

		try {
			const response = await fetch("/api/shipping/tracking", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					paymentId: payment.id,
					trackingNumber:
						payment.shipmentTracking?.trackingNumber ||
						"1234567890123",
				}),
			});

			if (response.ok) {
				// Recharger les informations de paiement
				await loadPayment();
			}
		} catch {
			setError("Erreur lors du transfert");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{getStatusIcon()}
						Statut du Paiement
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{loading ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								Chargement...
							</p>
						</div>
					) : !payment ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								Paiement non trouvé
							</p>
						</div>
					) : (
						<>
							{/* Informations générales */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Produit
									</p>
									<p className="text-sm text-muted-foreground">
										{payment.product.title}
									</p>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium">
										Montant total
									</p>
									<p className="text-lg font-bold">
										{payment.amount}€
									</p>
								</div>
							</div>

							{/* Statut du paiement */}
							<div className="space-y-2">
								<p className="text-sm font-medium">Statut</p>
								<Badge variant={getStatusColor()}>
									{getStatusText()}
								</Badge>
							</div>

							{/* Détails du transfert */}
							<div className="space-y-3 p-4 bg-muted/50 rounded-lg">
								<h4 className="font-medium flex items-center gap-2">
									<DollarSign className="h-4 w-4" />
									Détails du transfert
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">
											Montant total
										</p>
										<p className="font-medium">
											{payment.amount}€
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">
											Frais de plateforme
										</p>
										<p className="font-medium">
											-{payment.applicationFeeAmount || 0}
											€
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">
											Montant transféré
										</p>
										<p className="font-medium text-green-600">
											{getTransferAmount()}€
										</p>
									</div>
								</div>
							</div>

							{/* Informations utilisateurs */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<p className="text-sm font-medium flex items-center gap-2">
										<User className="h-4 w-4" />
										Acheteur
									</p>
									<div className="text-sm text-muted-foreground">
										<p>{payment.buyer.name}</p>
										<p>{payment.buyer.email}</p>
									</div>
								</div>
								<div className="space-y-2">
									<p className="text-sm font-medium flex items-center gap-2">
										<User className="h-4 w-4" />
										Vendeur
									</p>
									<div className="text-sm text-muted-foreground">
										<p>{payment.seller.name}</p>
										<p>{payment.seller.email}</p>
									</div>
								</div>
							</div>

							{/* Suivi de livraison */}
							{payment.shipmentTracking && (
								<div className="space-y-2">
									<p className="text-sm font-medium flex items-center gap-2">
										<Truck className="h-4 w-4" />
										Suivi de livraison
									</p>
									<div className="flex items-center gap-2">
										<Badge
											variant={
												payment.shipmentTracking
													.isDelivered
													? "default"
													: "outline"
											}
										>
											{payment.shipmentTracking
												.isDelivered
												? "Livré"
												: "En transit"}
										</Badge>
										<code className="text-sm bg-muted px-2 py-1 rounded">
											{
												payment.shipmentTracking
													.trackingNumber
											}
										</code>
									</div>
								</div>
							)}

							{/* Actions */}
							{payment.status === "pending" &&
								payment.shipmentTracking?.isDelivered && (
									<div className="flex items-center gap-4 pt-4 border-t">
										<div className="flex items-center gap-2">
											<Package className="h-4 w-4 text-green-500" />
											<span className="text-sm text-muted-foreground">
												Livraison confirmée - Transfert
												automatique disponible
											</span>
										</div>
										<Button
											size="sm"
											onClick={simulateTransfer}
											disabled={loading}
										>
											{loading
												? "Transfert..."
												: "Transférer au vendeur"}
										</Button>
									</div>
								)}

							{/* Informations temporelles */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
								<div>
									<p className="text-sm font-medium">
										Créé le
									</p>
									<p className="text-sm text-muted-foreground">
										{new Date(
											payment.createdAt
										).toLocaleDateString()}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium">
										Mis à jour le
									</p>
									<p className="text-sm text-muted-foreground">
										{new Date(
											payment.updatedAt
										).toLocaleDateString()}
									</p>
								</div>
							</div>
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
