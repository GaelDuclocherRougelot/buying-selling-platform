"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCommissionInfo } from "@/lib/hooks/useCommissionInfo";
import { Loader2 } from "lucide-react";
import CommissionInfo from "./CommissionInfo";

export default function SellerCommissionDashboard() {
	const { commissionInfo, loading, error } = useCommissionInfo();

	if (loading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin" />
					<span className="ml-2">Chargement...</span>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-8">
					<p className="text-red-600">Erreur: {error}</p>
				</CardContent>
			</Card>
		);
	}

	if (!commissionInfo) {
		return null;
	}

	return (
		<CommissionInfo
			currentSalesCount={commissionInfo.currentSalesCount}
			currentFeePercentage={commissionInfo.currentFeePercentage}
			breakdown={commissionInfo.breakdown}
		/>
	);
}

