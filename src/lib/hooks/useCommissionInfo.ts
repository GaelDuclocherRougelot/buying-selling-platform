"use client";

import { useCallback, useEffect, useState } from "react";
import { useErrorHandler } from "./useErrorHandler";

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
	const { handleError, handleApiError } = useErrorHandler();

	const fetchCommissionInfo = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await fetch("/api/platform/commission-info");

			if (!response.ok) {
				handleApiError(
					response,
					"Erreur lors de la récupération des informations"
				);
				return;
			}

			const result = await response.json();
			setCommissionInfo(result.data);
		} catch (err) {
			const error =
				err instanceof Error ? err : new Error("Erreur inconnue");
			setError(error.message);
			handleError(error, {
				fallbackMessage:
					"Erreur lors de la récupération des informations de commission",
				showToast: false,
				logToConsole: true,
			});
		} finally {
			setLoading(false);
		}
	}, [handleError, handleApiError]);

	useEffect(() => {
		fetchCommissionInfo();
	}, [fetchCommissionInfo]);

	return {
		commissionInfo,
		loading,
		error,
		refetch: fetchCommissionInfo,
	};
}
