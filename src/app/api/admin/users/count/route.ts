import { handleApiRoute } from "@/lib/api-error-handler";
import { prisma } from "@/lib/prisma";

export async function GET() {
	return handleApiRoute(async () => {
		const userCount = await prisma.user.count({
			where: { role: "user" },
		});

		return { count: userCount };
	});
}
