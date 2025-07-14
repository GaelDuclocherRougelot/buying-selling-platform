import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import AdminDashboard from "./_components/AdminDashboard";

/**
 * Admin Dashboard Page
 *
 * This page displays the main admin dashboard with navigation to different admin sections.
 * Only users with admin role can access this page.
 *
 * @protected
 * @requiresAdminRole
 */
export default async function AdminPage() {
	const user = await getUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "admin") {
		redirect("/");
	}

	return <AdminDashboard user={user} />;
}
