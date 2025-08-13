import swaggerJsdoc from "swagger-jsdoc";
import { Category } from "./schemas/Category";
import { Message } from "./schemas/Message";
import { Order } from "./schemas/Order";
import { Payment } from "./schemas/Payment";
import { Product } from "./schemas/Product";
import { Products } from "./schemas/Products";
import { User } from "./schemas/User";
import { swaggerTags } from "./tags";

/**
 * Generates the OpenAPI specification for the API documentation.
 * This function uses swagger-jsdoc to create a Swagger spec based on JSDoc comments in API routes.
 *
 * @returns {Promise<Record<string, unknown>>} A Promise that resolves to the OpenAPI specification object.
 */
export const getApiDocs = async () => {
	const options = {
		definition: {
			openapi: "3.0.0",
			info: {
				title: "ZONE - API",
				description:
					"API complète pour la plateforme ZONE",
				version: "1.0.0",
				contact: {
					name: "Équipe de développement",
					email: "dev@example.com",
				},
				license: {
					name: "MIT",
					url: "https://opensource.org/licenses/MIT",
				},
			},
			servers: [
				{
					url: "http://localhost:3000/api",
					description: "Serveur de développement",
				},
				{
					url: "https://buying-selling-platform.vercel.app",
					description: "Serveur de production",
				},
			],
			components: {
				securitySchemes: {
					BearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
				schemas: {
					Product: Product,
					Products: Products,
					User: User,
					Order: Order,
					Category: Category,
					Message: Message,
					Payment: Payment,
				},
			},
			tags: swaggerTags,
			security: [],
		},
		apis: ["src/app/api/**/*.ts", "src/app/api/**/*.js"], // Path to the API docs
	};

	const spec = swaggerJsdoc(options);
	return spec;
};
