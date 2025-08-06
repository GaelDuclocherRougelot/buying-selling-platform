"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders } from "@/lib/hooks/useOrders";
import { useState } from "react";

export function OrdersExample() {
	const [type, setType] = useState<"buyer" | "seller" | "all">("all");
	const { orders, isLoading, error, mutate } = useOrders(type, true);

	const handleRefresh = () => {
		mutate();
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Chargement des commandes...</CardTitle>
				</CardHeader>
				<CardContent>
					<p>Veuillez patienter...</p>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Erreur</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-red-500">
						Erreur lors du chargement des commandes
					</p>
					<Button onClick={handleRefresh} className="mt-2">
						Réessayer
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>
						Exemple d&apos;utilisation du service des commandes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2 mb-4">
						<Button
							variant={type === "all" ? "default" : "outline"}
							onClick={() => setType("all")}
						>
							Toutes
						</Button>
						<Button
							variant={type === "buyer" ? "default" : "outline"}
							onClick={() => setType("buyer")}
						>
							Achats
						</Button>
						<Button
							variant={type === "seller" ? "default" : "outline"}
							onClick={() => setType("seller")}
						>
							Ventes
						</Button>
						<Button onClick={handleRefresh} variant="outline">
							Actualiser
						</Button>
					</div>

					{orders?.stats && (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
							<div className="text-center p-2 bg-blue-50 rounded">
								<div className="text-lg font-bold">
									{orders.stats.totalBuyerOrders}
								</div>
								<div className="text-sm text-gray-600">
									Achats
								</div>
							</div>
							<div className="text-center p-2 bg-green-50 rounded">
								<div className="text-lg font-bold">
									{orders.stats.totalSellerOrders}
								</div>
								<div className="text-sm text-gray-600">
									Ventes
								</div>
							</div>
							<div className="text-center p-2 bg-orange-50 rounded">
								<div className="text-lg font-bold">
									{orders.stats.pendingBuyerOrders}
								</div>
								<div className="text-sm text-gray-600">
									Achats en attente
								</div>
							</div>
							<div className="text-center p-2 bg-yellow-50 rounded">
								<div className="text-lg font-bold">
									{orders.stats.pendingSellerOrders}
								</div>
								<div className="text-sm text-gray-600">
									Ventes en attente
								</div>
							</div>
						</div>
					)}

					<div className="space-y-2">
						<h3 className="font-semibold">Commandes récentes :</h3>
						{type === "all" || type === "buyer" ? (
							<div>
								<h4 className="font-medium text-blue-600">
									Achats ({orders?.buyerOrders?.length || 0})
								</h4>
								{orders?.buyerOrders?.map((order) => (
									<div
										key={order.id}
										className="p-2 bg-gray-50 rounded mb-2"
									>
										<div className="font-medium">
											{order.productTitle}
										</div>
										<div className="text-sm text-gray-600">
											Vendeur: {order.seller.username} |{" "}
											{order.amount.toFixed(2)}€ |{" "}
											{order.status}
										</div>
									</div>
								))}
							</div>
						) : null}

						{type === "all" || type === "seller" ? (
							<div>
								<h4 className="font-medium text-green-600">
									Ventes ({orders?.sellerOrders?.length || 0})
								</h4>
								{orders?.sellerOrders?.map((order) => (
									<div
										key={order.id}
										className="p-2 bg-gray-50 rounded mb-2"
									>
										<div className="font-medium">
											{order.productTitle}
										</div>
										<div className="text-sm text-gray-600">
											Acheteur: {order.buyer.username} |{" "}
											{order.amount.toFixed(2)}€ |{" "}
											{order.status}
										</div>
									</div>
								))}
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
