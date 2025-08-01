import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllUsers } from "@/services/user";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Validation schemas
const createUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.optional(),
	role: z.enum(["user", "admin", "moderator"]).default("user"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

// Helper function to check admin access
async function checkAdminAccess(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return { error: "Unauthorized", status: 401 };
	}

	if (session.user.role !== "admin") {
		return { error: "Forbidden: Admin access required", status: 403 };
	}

	return { user: session.user };
}

// GET /api/admin/users - Get all users with pagination
export async function GET(request: NextRequest) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "8");

		// Validate pagination parameters
		if (page < 1 || limit < 1 || limit > 50) {
			return NextResponse.json(
				{ error: "Invalid pagination parameters" },
				{ status: 400 }
			);
		}

		const result = await getAllUsers(page, limit);

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// POST /api/admin/users - Create a new user
export async function POST(request: NextRequest) {
	try {
		const authCheck = await checkAdminAccess(request);
		if ("error" in authCheck) {
			return NextResponse.json(
				{ error: authCheck.error },
				{ status: authCheck.status }
			);
		}

		const body = await request.json();
		const validatedData = createUserSchema.parse(body);

		// Check if email already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: validatedData.email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 400 }
			);
		}

		// Check if username already exists (if provided)
		if (validatedData.username) {
			const existingUsername = await prisma.user.findUnique({
				where: { username: validatedData.username },
			});

			if (existingUsername) {
				return NextResponse.json(
					{ error: "Username already taken" },
					{ status: 400 }
				);
			}
		}

		// Create user directly with Prisma since BetterAuth doesn't have createUser API
		const newUser = await prisma.user.create({
			data: {
				id: crypto.randomUUID(), // Generate a unique ID
				name: validatedData.name,
				email: validatedData.email,
				emailVerified: false, // Admin-created users need to verify email
				username: validatedData.username,
				displayUsername: validatedData.username,
				role: validatedData.role,
				// Note: Password will need to be handled separately since BetterAuth manages passwords
			},
		});

		return NextResponse.json(newUser, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Validation error", details: error.errors },
				{ status: 400 }
			);
		}

		console.error("Error creating user:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
