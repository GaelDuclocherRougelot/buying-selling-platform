"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/lib/hooks/useOrders";

export function OrdersStats() {
	const { orders, isLoading, error } = useOrders("all", true);

	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								<Skeleton className="h-4 w-24" />
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error || !orders?.stats) {
		return null;
	}

	const { stats } = orders;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Total Achats
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{stats.totalBuyerOrders}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Total Ventes
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{stats.totalSellerOrders}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Achats en Attente
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-orange-600">
						{stats.pendingBuyerOrders}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Ventes en Attente
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-blue-600">
						{stats.pendingSellerOrders}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
