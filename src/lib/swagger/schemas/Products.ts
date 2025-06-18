/**
 * Products schema definition for Swagger documentation.
 * This schema represents an array of Product objects.
 * It is used to document the API endpoint that returns a list of products.
 */
export const Products = {
    type: "array",
    items: { $ref: "#/components/schemas/Product" }
}