/**
 * Product schema definition for Swagger documentation.
 * This schema represents a product object with various properties such as id, title, description, price, condition, imagesUrl, createdAt, and updatedAt.
 * It is used to document the API endpoint that returns product details.
 */
export const Product = {
	type: "object",
	properties: {
		id: { type: "integer", example: 123 },
		title: { type: "string", example: "Chaise design" },
		description: {
			type: "string",
			example: "Chaise en bois, très bon état",
		},
		price: { type: "number", example: 49.99 },
		condition: { type: "string", example: "GOOD" },
		imagesUrl: {
			type: "array",
			items: { type: "string" },
			example: ["https://example.com/image1.jpg"],
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
