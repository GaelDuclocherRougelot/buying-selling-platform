import { addCorsHeaders, handleCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const { searchParams } = new URL(request.url);

		// Récupération des paramètres de recherche
		const query = searchParams.get("q") || "";
		const category = searchParams.get("category") || "";
		const condition = searchParams.get("condition") || "";
		const minPrice = searchParams.get("minPrice") || "";
		const maxPrice = searchParams.get("maxPrice") || "";
		const delivery = searchParams.get("delivery") || "";
		const city = searchParams.get("city") || "";
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const sortOrder = searchParams.get("sortOrder") || "desc";
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "12");
		const offset = (page - 1) * limit;

		// Construction des filtres
		const where: any = {
			status: "active", // Seulement les produits actifs
		};

		// Recherche textuelle
		if (query) {
			where.OR = [
				{ title: { contains: query, mode: "insensitive" } },
				{ description: { contains: query, mode: "insensitive" } },
			];
		}

		// Filtre par catégorie
		if (category) {
			where.category = {
				name: category,
			};
		}

		// Filtre par état
		if (condition) {
			where.condition = condition;
		}

		// Filtre par prix
		if (minPrice || maxPrice) {
			where.price = {};
			if (minPrice) where.price.gte = parseFloat(minPrice);
			if (maxPrice) where.price.lte = parseFloat(maxPrice);
		}

		// Filtre par livraison
		if (delivery) {
			where.delivery = delivery;
		}

		// Filtre par ville
		if (city) {
			where.city = { contains: city, mode: "insensitive" };
		}

		// Tri
		const orderBy: any = {};
		orderBy[sortBy] = sortOrder;

		// Requête avec pagination
		const [products, totalCount] = await Promise.all([
			prisma.product.findMany({
				where,
				include: {
					category: true,
					owner: {
						select: {
							id: true,
							name: true,
							username: true,
							displayUsername: true,
						},
					},
				},
				orderBy,
				take: limit,
				skip: offset,
			}),
			prisma.product.count({ where }),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		const response = NextResponse.json({
			products,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
			},
		});
		return addCorsHeaders(response);
	} catch (error) {
		console.error("Error searching products:", error);
		const response = NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
		return addCorsHeaders(response);
	}
}
