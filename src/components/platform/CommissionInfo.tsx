"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getNextVolumeTier, VOLUME_DISCOUNTS } from "@/lib/platform-fees";
import { Target, TrendingDown, Trophy } from "lucide-react";

interface CommissionInfoProps {
	currentSalesCount: number;
	currentFeePercentage: number;
	breakdown: string;
}

export default function CommissionInfo({
	currentSalesCount,
	currentFeePercentage,
	breakdown,
}: CommissionInfoProps) {
	const tierInfo = getNextVolumeTier(currentSalesCount);

	return (
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingDown className="h-5 w-5 text-green-600" />
					Vos frais de commission
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Commission actuelle */}
				<div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
					<div>
						<p className="text-sm text-green-700">
							Commission actuelle
						</p>
						<p className="font-semibold text-green-800">
							{(currentFeePercentage * 100).toFixed(1)}%
						</p>
						<p className="text-xs text-green-600">{breakdown}</p>
					</div>
					<Badge
						variant="outline"
						className="bg-green-100 text-green-800"
					>
						{currentSalesCount} vente
						{currentSalesCount > 1 ? "s" : ""}
					</Badge>
				</div>

				{/* Paliers de volume */}
				<div className="space-y-3">
					<h4 className="font-medium flex items-center gap-2">
						<Trophy className="h-4 w-4 text-amber-600" />
						Paliers de commission
					</h4>

					<div className="grid gap-2">
						{VOLUME_DISCOUNTS.map((tier, index) => {
							const isCurrentTier =
								currentSalesCount >= tier.minSales &&
								currentSalesCount <= tier.maxSales;
							const isUnlocked =
								currentSalesCount >= tier.minSales;

							return (
								<div
									key={index}
									className={`flex items-center justify-between p-2 rounded-lg border ${
										isCurrentTier
											? "bg-blue-50 border-blue-200"
											: isUnlocked
												? "bg-gray-50 border-gray-200"
												: "bg-gray-25 border-gray-100"
									}`}
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-3 h-3 rounded-full ${
												isCurrentTier
													? "bg-blue-500"
													: isUnlocked
														? "bg-green-500"
														: "bg-gray-300"
											}`}
										/>
										<span
											className={`text-sm ${
												isCurrentTier
													? "font-medium"
													: ""
											}`}
										>
											{tier.minSales === 0
												? "Débutant"
												: tier.minSales === 10
													? "Vendeur confirmé"
													: "Vendeur expert"}
											({tier.minSales}-
											{tier.maxSales === 999
												? "∞"
												: tier.maxSales}
											)
										</span>
									</div>
									<Badge
										variant={
											isCurrentTier
												? "default"
												: "outline"
										}
										className={
											isCurrentTier
												? "bg-blue-600"
												: isUnlocked
													? "bg-green-100 text-green-800"
													: ""
										}
									>
										{tier.feePercentage * 100}%
									</Badge>
								</div>
							);
						})}
					</div>
				</div>

				{/* Progression vers le palier suivant */}
				{tierInfo?.nextTier && tierInfo.salesNeeded && (
					<div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
						<div className="flex items-center gap-2">
							<Target className="h-4 w-4 text-blue-600" />
							<p className="text-sm font-medium text-blue-800">
								Prochain objectif
							</p>
						</div>

						<p className="text-xs text-blue-700">
							Plus que{" "}
							<strong>
								{tierInfo.salesNeeded} vente
								{tierInfo.salesNeeded > 1 ? "s" : ""}
							</strong>{" "}
							pour passer à{" "}
							<strong>
								{tierInfo.nextTier.feePercentage * 100}%
							</strong>{" "}
							de commission
						</p>

						<div className="space-y-1">
							<div className="flex justify-between text-xs text-blue-600">
								<span>{currentSalesCount} ventes</span>
								<span>{tierInfo.nextTier.minSales} ventes</span>
							</div>
							<Progress
								value={
									(currentSalesCount /
										tierInfo.nextTier.minSales) *
									100
								}
								className="h-2"
							/>
						</div>
					</div>
				)}

				{/* Avantages */}
				<div className="text-xs text-gray-600 space-y-1">
					<p>
						💡 <strong>Astuce :</strong> Plus vous vendez, moins
						vous payez de commission !
					</p>
					<p>
						🎯 <strong>Objectif :</strong> Atteignez 50 ventes pour
						ne payer que 3% de commission
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

