/**
 * Message schema definition for Swagger documentation.
 * This schema represents a message object.
 */
export const Message = {
	type: "object",
	properties: {
		id: { type: "string", example: "msg_123" },
		senderId: { type: "string", example: "user_123" },
		receiverId: { type: "string", example: "user_789" },
		content: {
			type: "string",
			example: "Bonjour, votre produit est-il toujours disponible ?",
		},
		read: { type: "boolean", example: false },
		createdAt: {
			type: "string",
			format: "date-time",
			example: "2024-06-18T12:34:56.000Z",
		},
	},
};
