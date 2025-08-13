import { z } from "zod";

// Schéma pour la création d'un produit
export const createProductSchema = z.object({
	title: z.string().min(1, "Le titre est requis"),
	description: z.string().optional(),
	price: z.number().min(0, "Le prix doit être positif"),
	condition: z.string().min(1, "L'état est requis"),
	imagesUrl: z.array(z.string().url("Chaque image doit être une URL valide")),
	categoryId: z.string().min(1, "L'ID de catégorie est requis"),
	ownerId: z.string().min(1, "L'ID du propriétaire est requis"),
	delivery: z.string().min(1, "La livraison est requise"),
	city: z.string().optional(),
	deliveryPrice: z.number().default(0),
});

// Schéma pour la mise à jour d'un produit
export const updateProductSchema = z.object({
	title: z.string().min(1, "Le titre est requis").optional(),
	description: z.string().optional(),
	price: z.number().min(0, "Le prix doit être positif").optional(),
	condition: z.string().min(1, "L'état est requis").optional(),
	imagesUrl: z
		.array(z.string().url("Chaque image doit être une URL valide"))
		.optional(),
	categoryId: z.string().min(1, "L'ID de catégorie est requis").optional(),
	delivery: z.string().min(1, "La livraison est requise").optional(),
	city: z.string().optional(),
	deliveryPrice: z
		.number()
		.min(0, "Le prix de livraison doit être positif")
		.optional(),
	status: z
		.enum(["active", "inactive", "pending", "sold", "rejected"])
		.optional(),
});

// Type pour la création d'un produit
export type CreateProductInput = z.infer<typeof createProductSchema>;

// Type pour la mise à jour d'un produit
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
