import { createSwaggerSpec } from "next-swagger-doc";
import { Product } from "./schemas/Product";
import { Products } from "./schemas/Products";

export const getApiDocs = async () => {
	const spec = createSwaggerSpec({
		apiFolder: "src/app/api",
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
					Products: Products
				},
			},
			security: [],
		},
	});
	return spec;
};
