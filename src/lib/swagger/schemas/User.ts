/**
 * User schema definition for Swagger documentation.
 * This schema represents a user object with various properties.
 */
export const User = {
	type: "object",
	properties: {
		id: { type: "string", example: "user_123" },
		email: { type: "string", format: "email", example: "user@example.com" },
		displayUsername: { type: "string", example: "john_doe" },
		firstName: { type: "string", example: "John" },
		lastName: { type: "string", example: "Doe" },
		role: {
			type: "string",
			enum: ["user", "admin"],
			example: "user",
		},
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
