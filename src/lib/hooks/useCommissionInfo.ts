"use client";

import { useEffect, useState } from "react";

interface CommissionInfo {
	currentSalesCount: number;
	currentFeePercentage: number;
	breakdown: string;
	nextTier?: {
		minSales: number;
		feePercentage: number;
	};
	salesNeeded?: number;
	currentTier?: {
		minSales: number;
		maxSales: number;
		feePercentage: number;
	};
}

export function useCommissionInfo() {
	const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(
		null
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCommissionInfo = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch("/api/platform/commission-info");

			if (!response.ok) {
				throw new Error(
					"Erreur lors de la récupération des informations"
				);
			}

			const result = await response.json();
			setCommissionInfo(result.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
			console.error("Erreur useCommissionInfo:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCommissionInfo();
	}, []);

	return {
		commissionInfo,
		loading,
		error,
		refetch: fetchCommissionInfo,
	};
}

