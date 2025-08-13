/**
 * Payment schema definition for Swagger documentation.
 * This schema represents a payment object.
 */
export const Payment = {
	type: "object",
	properties: {
		id: { type: "string", example: "pay_123" },
		orderId: { type: "string", example: "order_456" },
		amount: { type: "number", example: 59.99 },
		currency: { type: "string", example: "EUR" },
		status: {
			type: "string",
			enum: ["pending", "succeeded", "failed", "cancelled"],
			example: "succeeded",
		},
		paymentMethod: { type: "string", example: "card" },
		stripePaymentIntentId: { type: "string", example: "pi_1234567890" },
		createdAt: {
			type: "string",
			format: "date-time",
			example: "2024-06-18T12:34:56.000Z",
		},
	},
};
