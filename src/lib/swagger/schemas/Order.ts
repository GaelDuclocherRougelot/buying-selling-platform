/**
 * Order schema definition for Swagger documentation.
 * This schema represents an order object with various properties.
 */
export const Order = {
	type: "object",
	properties: {
		id: { type: "string", example: "order_123" },
		productId: { type: "string", example: "product_456" },
		buyerId: { type: "string", example: "user_123" },
		sellerId: { type: "string", example: "user_789" },
		status: { 
			type: "string", 
			enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
			example: "pending"
		},
		totalAmount: { type: "number", example: 59.99 },
		deliveryPrice: { type: "number", example: 5.99 },
		deliveryAddress: { type: "string", example: "123 Rue de la Paix, Paris" },
		createdAt: {
			type: "string",
			format: "date-time",
			example: "2024-06-18T12:34:56.000Z",
		},
		updatedAt: {
			type: "string",
			format: "date-time",
			example: "2024-06-18T12:34:56.000Z",
		},
	},
};
