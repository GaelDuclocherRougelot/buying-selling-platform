import swaggerJsdoc from "swagger-jsdoc";
import { Product } from "./schemas/Product";
import { Products } from "./schemas/Products";

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
				title: "Next Swagger API Doc",
				version: "1.0",
			},
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
				},
			},
			security: [],
		},
		apis: ["src/app/api/**/*.ts", "src/app/api/**/*.js"], // Path to the API docs
	};

	const spec = swaggerJsdoc(options);
	return spec;
};
