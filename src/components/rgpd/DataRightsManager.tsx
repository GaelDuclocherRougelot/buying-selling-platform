"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { AlertTriangle, Download, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DataRightsManager() {
	const [loading, setLoading] = useState(false);
	const { handleError, handleApiError } = useErrorHandler();

	const handleDataExport = async () => {
		setLoading(true);
		try {
			const response = await apiFetch("/api/users/data-export");

			if (response.ok) {
				const data = await response.json();
				const blob = new Blob([JSON.stringify(data, null, 2)], {
					type: "application/json",
				});
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `mes-donnees-${new Date().toISOString().split("T")[0]}.json`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				toast.success("Vos données ont été exportées avec succès");
			} else {
				handleApiError(
					response,
					"Erreur lors de l'export de vos données"
				);
			}
		} catch (error) {
			handleError(error, {
				fallbackMessage: "Erreur lors de l'export de vos données",
				showToast: true,
				logToConsole: true,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-start space-x-2">
					<AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
					<div className="text-sm text-blue-800">
						<p className="font-medium mb-2">Vos droits RGPD :</p>
						<ul className="list-disc list-inside space-y-1">
							<li>
								<strong>Droit d&apos;accès :</strong> Vous
								pouvez télécharger toutes vos données
							</li>
							<li>
								<strong>Droit de rectification :</strong>{" "}
								Modifiez vos informations dans votre profil
							</li>
							<li>
								<strong>Droit à l&apos;effacement :</strong>{" "}
								Supprimez votre compte définitivement
							</li>
							<li>
								<strong>Droit à la portabilité :</strong>{" "}
								Exportez vos données au format JSON
							</li>
							<li>
								<strong>Droit d&apos;opposition :</strong>{" "}
								Contactez-nous pour toute question
							</li>
						</ul>
					</div>
				</div>
			</div>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center space-x-2">
						<Eye className="h-5 w-5" />
						<span>Droit d&apos;accès à vos données</span>
					</CardTitle>
					<CardDescription>
						Téléchargez toutes les données que nous détenons sur
						vous au format JSON
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={handleDataExport}
						disabled={loading}
						className="flex items-center space-x-2"
					>
						<Download size={16} />
						<span>Exporter mes données</span>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
