import { getApiDocs } from "@/lib/swagger/swagger";
import ReactSwagger from "@/features/docs/SwaggerUI";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { toast } from "sonner";

export default async function IndexPage() {
	// Vérifier l'authentification et le rôle admin
	const user = await getUser();
	
	if (!user) {
		redirect("/auth/login");
	}

	// Vérifier si l'utilisateur est admin
	if (user.role !== "admin") {
		toast.error("Vous n'avez pas les permissions nécessaires pour accéder à cette page.");
		redirect("/auth/login");
	}

	const spec = await getApiDocs() as Record<string, unknown>;
	
	return (
		<section className="container">
			<ReactSwagger spec={spec} />
		</section>
	);
}
