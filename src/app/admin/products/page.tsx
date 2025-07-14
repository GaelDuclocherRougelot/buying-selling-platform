import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import AdminProductsPage from "./_components/AdminProductsPage";

/**
 * Admin Products Page
 *
 * This page displays the products management interface for admins.
 * Only users with admin role can access this page.
 *
 * @protected
 * @requiresAdminRole
 */
export default async function AdminProducts() {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "admin") {
		redirect("/");
	}

	return <AdminProductsPage />;
}
