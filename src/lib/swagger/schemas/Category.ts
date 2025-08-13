/**
 * Category schema definition for Swagger documentation.
 * This schema represents a category object.
 */
export const Category = {
	type: "object",
	properties: {
		id: { type: "string", example: "cat_123" },
		name: { type: "string", example: "Électronique" },
		description: {
			type: "string",
			example: "Produits électroniques et informatiques",
		},
		icon: { type: "string", example: "laptop" },
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
