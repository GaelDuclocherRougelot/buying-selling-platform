import { deleteMultipleImagesFromCloudinary } from "@/lib/cloudinary-utils";
import { addCorsHeaders, corsResponse, handleCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to fetch
 *     responses:
 *       200:
 *         description: User information
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const { userId } = await params;

		if (!userId) {
			return corsResponse({ error: "Missing userId" }, 400);
		}

		const user = await prisma.user.findUnique({
			where: {
				id: userId,
				deletedAt: null, // Exclude deleted users
			},
			select: {
				id: true,
				name: true,
				username: true,
				displayUsername: true,
				image: true,
				createdAt: true,
				// Don't include sensitive information like email
			},
		});

		if (!user) {
			return corsResponse({ error: "User not found" }, 404);
		}

		return addCorsHeaders(NextResponse.json(user, { status: 200 }));
	} catch (error) {
		console.error("Error fetching user:", error);
		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Delete user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	// Handle CORS preflight
	const corsPreflightResponse = handleCors(request);
	if (corsPreflightResponse) return corsPreflightResponse;

	try {
		const { userId } = await params;

		if (!userId) {
			return corsResponse({ error: "Missing userId" }, 400);
		}

		// Get user with all their products to collect image URLs
		const user = await prisma.user.findUnique({
			where: {
				id: userId,
				deletedAt: null,
			},
			include: {
				products: {
					select: {
						imagesUrl: true,
					},
				},
			},
		});

		if (!user) {
			return corsResponse({ error: "User not found" }, 404);
		}

		// Collect all image URLs from user's products
		const allImageUrls: string[] = [];
		user.products.forEach((product) => {
			if (product.imagesUrl && product.imagesUrl.length > 0) {
				allImageUrls.push(...product.imagesUrl);
			}
		});

		// Add user's profile image if it exists
		if (user.image) {
			allImageUrls.push(user.image);
		}

		// Delete all images from Cloudinary
		if (allImageUrls.length > 0) {
			const deleteResult =
				await deleteMultipleImagesFromCloudinary(allImageUrls);
			console.log(
				`Images supprimées de Cloudinary lors de la suppression de l'utilisateur: ${deleteResult.success} réussies, ${deleteResult.failed} échouées`
			);
		}

		// Delete the user (soft delete)
		await prisma.user.update({
			where: { id: userId },
			data: { deletedAt: new Date() },
		});

		return addCorsHeaders(
			NextResponse.json(
				{ message: "User deleted successfully" },
				{ status: 200 }
			)
		);
	} catch (error) {
		console.error("Error deleting user:", error);
		return corsResponse({ error: "Internal Server Error" }, 500);
	}
}
