import { handleApiRoute } from "@/lib/api-error-handler";
import { getTopCategoriesByProductCount } from "@/services/category";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	return handleApiRoute(async () => {
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");

		const featuredCategories = await getTopCategoriesByProductCount(limit);
		return featuredCategories;
	});
}
