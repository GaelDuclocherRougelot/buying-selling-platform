import { apiFetch } from "@/lib/api";
import useSWR from "swr";

export interface Order {
	id: string;
	productTitle: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: string;
	updatedAt: string;
	product: {
		id: string;
		title: string;
		price: number;
		imagesUrl: string[];
		category: {
			name: string;
			displayName: string;
		};
	};
	buyer: {
		id: string;
		username: string | null;
		email: string;
	};
	seller: {
		id: string;
		username: string | null;
		email: string;
	};
	shipmentTracking?: {
		trackingNumber: string;
		status: string;
		carrier: string;
		lastEventLabel?: string | null;
		lastEventDate?: string | null;
		estimatedDeliveryDate?: string | null;
		actualDeliveryDate?: string | null;
	};
	shippingProof?: {
		id: string;
		proofType: string;
		proofData: unknown;
		status: string;
		submittedAt: string;
		verifiedAt?: string | null;
		verifiedBy?: string | null;
	};
}

export interface OrdersResponse {
	buyerOrders: Order[];
	sellerOrders: Order[];
	stats?: {
		totalBuyerOrders: number;
		totalSellerOrders: number;
		pendingBuyerOrders: number;
		pendingSellerOrders: number;
	};
}

export function useOrders(
	type?: "buyer" | "seller" | "all",
	includeStats = false
) {
	const params = new URLSearchParams();
	if (type) params.append("type", type);
	if (includeStats) params.append("stats", "true");

	const { data, error, isLoading, mutate } = useSWR<OrdersResponse>(
		`/api/orders?${params.toString()}`,
		async (url) => {
			const response = await apiFetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch orders");
			}
			return response.json();
		},
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: true,
		}
	);

	return {
		orders: data,
		isLoading,
		error,
		mutate,
	};
}

export function useOrder(orderId: string) {
	const { data, error, isLoading, mutate } = useSWR<{ order: Order }>(
		`/api/orders/${orderId}`,
		async (url) => {
			const response = await apiFetch(url);
			if (!response.ok) {
				throw new Error("Failed to fetch order");
			}
			return response.json();
		},
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: true,
		}
	);

	return {
		order: data?.order,
		isLoading,
		error,
		mutate,
	};
}
