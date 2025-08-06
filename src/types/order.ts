export interface Order {
	id: string;
	productTitle: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
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
		lastEventDate?: Date | null;
		estimatedDeliveryDate?: Date | null;
		actualDeliveryDate?: Date | null;
	};
	shippingProof?: {
		id: string;
		proofType: string;
		proofData: unknown;
		status: string;
		submittedAt: Date;
		verifiedAt?: Date | null;
		verifiedBy?: string | null;
	};
}
