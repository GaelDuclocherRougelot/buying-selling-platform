"use client";

import Header from "@/components/global/Header";
import { OrdersList, OrdersStats } from "@/components/orders";

export default function OrdersClientPage() {
	return (
		<>
			<Header />
			<main className="flex justify-center px-4 lg:px-10 py-8">
				<div className="w-full max-w-[1300px] space-y-8">
					{/* Titre de la page */}
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2">
							Mes Commandes
						</h1>
						<p className="text-gray-600">
							Gérez vos commandes en tant qu&apos;acheteur et
							vendeur
						</p>
					</div>

					{/* Statistiques */}
					<OrdersStats />

					{/* Liste des commandes */}
					<OrdersList type="all" />
				</div>
			</main>
		</>
	);
}
