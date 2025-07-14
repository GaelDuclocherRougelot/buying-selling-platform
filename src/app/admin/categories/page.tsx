import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import AdminCategoriesPage from "./_components/AdminCategoriesPage";

/**
 * Admin Categories Page
 *
 * This page displays the categories management interface for admins.
 * Only users with admin role can access this page.
 *
 * @protected
 * @requiresAdminRole
 */
export default async function AdminCategories() {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "admin") {
		redirect("/");
	}

	return <AdminCategoriesPage />;
}
