"use client";

import ShippingProofForm from "@/components/shipping/ShippingProofForm";
import TrackingStatus from "@/components/shipping/TrackingStatus";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/lib/hooks/useOrders";
import { toast } from "sonner";
import BuyerValidateButton from "../payment/BuyerValidateButton";
import PaymentButton from "../stripe/PaymentButton";

interface OrdersListProps {
	type?: "buyer" | "seller" | "all";
	includeStats?: boolean;
}

export function OrdersList({
	type = "all",
	includeStats = false,
}: OrdersListProps) {
	const { orders, isLoading, error, mutate } = useOrders(type, includeStats);

	const refreshOrders = () => {
		mutate();
		toast.success("Commandes mises à jour");
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "waiting_payment":
				return (
					<Badge className="bg-orange-100 text-orange-800">
						En attente de paiement
					</Badge>
				);
			case "pending":
				return (
					<Badge className="bg-orange-100 text-orange-800">
						En attente
					</Badge>
				);
			case "pending_shipping_validation":
				return (
					<Badge className="bg-blue-100 text-blue-800">
						En attente d&apos;expédition
					</Badge>
				);
			case "pending_buyer_validation":
				return (
					<Badge className="bg-purple-100 text-purple-800">
						En attente de validation acheteur
					</Badge>
				);
			case "succeeded":
				return (
					<Badge className="bg-green-100 text-green-800">
						Livré et payé
					</Badge>
				);
			case "failed":
				return (
					<Badge className="bg-red-100 text-red-800">
						Échec du paiement
					</Badge>
				);
			case "canceled":
				return (
					<Badge className="bg-gray-100 text-gray-800">Annulé</Badge>
				);
			case "refunded":
				return (
					<Badge className="bg-purple-100 text-purple-800">
						Remboursé
					</Badge>
				);
			default:
				return <Badge variant="secondary">Inconnu</Badge>;
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i} className="p-4">
						<div className="flex justify-between items-start mb-4">
							<div className="space-y-2 flex-1">
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-3 w-1/2" />
								<Skeleton className="h-3 w-1/3" />
								<Skeleton className="h-3 w-1/4" />
							</div>
							<Skeleton className="h-6 w-24" />
						</div>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<p className="text-red-500">
					Erreur lors du chargement des commandes
				</p>
			</div>
		);
	}

	if (!orders) {
		return null;
	}

	const buyerOrders = orders.buyerOrders || [];
	const sellerOrders = orders.sellerOrders || [];

	return (
		<div className="flex flex-col gap-6">
			{/* Section Mes Achats */}
			{(type === "buyer" || type === "all") && (
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">
							Mes Achats ({buyerOrders.length})
						</CardTitle>
						<p className="text-sm text-gray-600">
							Suivez vos achats et vérifiez l&apos;état de vos
							commandes.
							<br />
							<strong>Important :</strong> Le paiement est
							transféré au vendeur uniquement après livraison
							confirmée.
						</p>
					</CardHeader>
					<CardContent>
						{buyerOrders.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">
									Aucun achat pour le moment
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{buyerOrders.map((order) => (
									<Card key={order.id} className="p-4">
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="font-semibold">
													{order.productTitle}
												</h3>
												<p className="text-sm text-gray-600">
													Vendeur :{" "}
													{order.seller.username}
												</p>
												<p className="text-sm text-gray-600">
													Commande du{" "}
													{new Date(
														order.createdAt
													).toLocaleDateString(
														"fr-FR"
													)}
												</p>
												<p className="text-sm font-medium">
													{order.amount.toFixed(2)}€
												</p>
											</div>
											{getStatusBadge(order.status)}
										</div>
										{order.status === "waiting_payment" && (
											<PaymentButton
												productId={order.product.id}
												productTitle={
													order.productTitle
												}
												amount={order.amount}
											/>
										)}
										{order.status ===
											"pending_buyer_validation" && (
											<BuyerValidateButton
												paymentId={order.id}
												productTitle={
													order.productTitle
												}
												amount={order.amount}
												onValidated={() => {
													refreshOrders();
												}}
											/>
										)}
										{order.status ===
											"pending_shipping_validation" && (
											<TrackingStatus
												paymentId={order.id}
											/>
										)}
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Section Mes Ventes */}
			{(type === "seller" || type === "all") && (
				<Card>
					<CardHeader>
						<CardTitle className="text-xl">
							Mes Ventes ({sellerOrders.length})
						</CardTitle>
						<p className="text-sm text-gray-600">
							Gérez vos ventes et soumettez des preuves
							d&apos;expédition.
							<br />
							<strong>Rappel :</strong> Le paiement est transféré
							uniquement après vérification de la preuve.
						</p>
					</CardHeader>
					<CardContent>
						{sellerOrders.length === 0 ? (
							<div className="text-center py-8">
								<p className="text-gray-500">
									Aucune vente pour le moment
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{sellerOrders.map((order) => (
									<Card key={order.id} className="p-4">
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="font-semibold">
													{order.productTitle}
												</h3>
												<p className="text-sm text-gray-600">
													Acheteur :{" "}
													{order.buyer.username}
												</p>
												<p className="text-sm text-gray-600">
													Commande du{" "}
													{new Date(
														order.createdAt
													).toLocaleDateString(
														"fr-FR"
													)}
												</p>
												<p className="text-sm font-medium">
													{order.amount.toFixed(2)}€
												</p>
											</div>
											{getStatusBadge(order.status)}
										</div>
										{order.status ===
											"pending_shipping_validation" && (
											<ShippingProofForm
												paymentId={order.id}
												productTitle={
													order.productTitle
												}
												buyerName={
													order.buyer.username ||
													"Utilisateur"
												}
											/>
										)}
									</Card>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
