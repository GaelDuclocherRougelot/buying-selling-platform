import { LoginLogsTable } from "@/components/admin/login-logs-table";
import { LoginStats } from "@/components/admin/login-stats";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function LoginLogsPage() {
	return (
		<div className="container mx-auto py-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Logs de connexion
					</h1>
					<p className="text-muted-foreground">
						Surveillez les activités de connexion des utilisateurs
					</p>
				<Link href="/admin">
					<Button className="mt-4 px-4 py-2">
						← Retour au dashboard
					</Button>
				</Link>
				</div>
			</div>

			<Suspense fallback={<div>Chargement des statistiques...</div>}>
				<LoginStats />
			</Suspense>

			<Suspense fallback={<div>Chargement des logs...</div>}>
				<LoginLogsTable />
			</Suspense>
		</div>
	);
}
