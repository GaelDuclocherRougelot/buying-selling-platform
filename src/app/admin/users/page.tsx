import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import AdminUsersPage from "./_components/AdminUsersPage";

/**
 * Admin Users Page
 *
 * This page displays the users management interface for admins.
 * Only users with admin role can access this page.
 *
 * @protected
 * @requiresAdminRole
 */
export default async function AdminUsers() {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "admin") {
		redirect("/");
	}

	return <AdminUsersPage />;
}
