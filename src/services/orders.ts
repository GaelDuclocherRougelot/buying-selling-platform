import { prisma } from "@/lib/prisma";

export interface Order {
	id: string;
	productTitle: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	// Relations
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

/**
 * Récupère toutes les commandes d'un utilisateur en tant qu'acheteur
 */
export async function getUserBuyerOrders(userId: string): Promise<Order[]> {
	const orders = await prisma.payment.findMany({
		where: {
			buyerId: userId,
		},
		include: {
			product: {
				include: {
					category: {
						select: {
							name: true,
							displayName: true,
						},
					},
				},
			},
			buyer: {
				select: {
					id: true,
					username: true,
					email: true,
				},
			},
			seller: {
				select: {
					id: true,
					username: true,
					email: true,
				},
			},
			shipmentTracking: {
				select: {
					trackingNumber: true,
					status: true,
					carrier: true,
					lastEventLabel: true,
					lastEventDate: true,
					estimatedDeliveryDate: true,
					actualDeliveryDate: true,
				},
			},
			shippingProof: {
				select: {
					id: true,
					proofType: true,
					proofData: true,
					status: true,
					submittedAt: true,
					verifiedAt: true,
					verifiedBy: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return orders.map((payment) => ({
		id: payment.id,
		productTitle: payment.product.title,
		amount: payment.amount,
		currency: payment.currency,
		status: payment.status,
		createdAt: payment.createdAt,
		updatedAt: payment.updatedAt,
		product: {
			id: payment.product.id,
			title: payment.product.title,
			price: payment.product.price,
			imagesUrl: payment.product.imagesUrl,
			category: payment.product.category,
		},
		buyer: payment.buyer,
		seller: payment.seller,
		shipmentTracking: payment.shipmentTracking || undefined,
		shippingProof: payment.shippingProof || undefined,
	}));
}

/**
 * Récupère toutes les commandes d'un utilisateur en tant que vendeur
 */
export async function getUserSellerOrders(userId: string): Promise<Order[]> {
	const orders = await prisma.payment.findMany({
		where: {
			sellerId: userId,
		},
		include: {
			product: {
				include: {
					category: {
						select: {
							name: true,
							displayName: true,
						},
					},
				},
			},
			buyer: {
				select: {
					id: true,
					username: true,
					email: true,
				},
			},
			seller: {
				select: {
					id: true,
					username: true,
					email: true,
				},
			},
			shipmentTracking: {
				select: {
					trackingNumber: true,
					status: true,
					carrier: true,
					lastEventLabel: true,
					lastEventDate: true,
					estimatedDeliveryDate: true,
					actualDeliveryDate: true,
				},
			},
			shippingProof: {
				select: {
					id: true,
					proofType: true,
					proofData: true,
					status: true,
					submittedAt: true,
					verifiedAt: true,
					verifiedBy: true,
				},
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return orders.map((payment) => ({
		id: payment.id,
		productTitle: payment.product.title,
		amount: payment.amount,
		currency: payment.currency,
		status: payment.status,
		createdAt: payment.createdAt,
		updatedAt: payment.updatedAt,
		product: {
			id: payment.product.id,
			title: payment.product.title,
			price: payment.product.price,
			imagesUrl: payment.product.imagesUrl,
			category: payment.product.category,
		},
		buyer: payment.buyer,
		seller: payment.seller,
		shipmentTracking: payment.shipmentTracking || undefined,
		shippingProof: payment.shippingProof || undefined,
	}));
}

/**
 * Récupère une commande spécifique par son ID
 */
export async function getOrderById(
	orderId: string,
	userId: string
): Promise<Order | null> {
	const order = await prisma.payment.findFirst({
		where: {
			id: orderId,
			OR: [{ buyerId: userId }, { sellerId: userId }],
		},
		include: {
			product: {
				include: {
					category: {
						select: {
							name: true,
							displayName: true,
						},
					},
				},
			},
			buyer: {
				select: {
					id: true,
					username: true,
					email: true,
				},
			},
			seller: {
				select: {
					id: true,
					username: true,
					email: true,
				},
			},
			shipmentTracking: {
				select: {
					trackingNumber: true,
					status: true,
					carrier: true,
					lastEventLabel: true,
					lastEventDate: true,
					estimatedDeliveryDate: true,
					actualDeliveryDate: true,
				},
			},
			shippingProof: {
				select: {
					id: true,
					proofType: true,
					proofData: true,
					status: true,
					submittedAt: true,
					verifiedAt: true,
					verifiedBy: true,
				},
			},
		},
	});

	if (!order) {
		return null;
	}

	return {
		id: order.id,
		productTitle: order.product.title,
		amount: order.amount,
		currency: order.currency,
		status: order.status,
		createdAt: order.createdAt,
		updatedAt: order.updatedAt,
		product: {
			id: order.product.id,
			title: order.product.title,
			price: order.product.price,
			imagesUrl: order.product.imagesUrl,
			category: order.product.category,
		},
		buyer: order.buyer,
		seller: order.seller,
		shipmentTracking: order.shipmentTracking || undefined,
		shippingProof: order.shippingProof || undefined,
	};
}

/**
 * Récupère les statistiques des commandes d'un utilisateur
 */
export async function getUserOrderStats(userId: string) {
	const [buyerOrders, sellerOrders] = await Promise.all([
		prisma.payment.count({
			where: { buyerId: userId },
		}),
		prisma.payment.count({
			where: { sellerId: userId },
		}),
	]);

	const [pendingBuyerOrders, pendingSellerOrders] = await Promise.all([
		prisma.payment.count({
			where: {
				buyerId: userId,
				status: {
					in: ["pending", "pending_shipping_validation"],
				},
			},
		}),
		prisma.payment.count({
			where: {
				sellerId: userId,
				status: {
					in: ["pending", "pending_shipping_validation"],
				},
			},
		}),
	]);

	return {
		totalBuyerOrders: buyerOrders,
		totalSellerOrders: sellerOrders,
		pendingBuyerOrders,
		pendingSellerOrders,
	};
}
