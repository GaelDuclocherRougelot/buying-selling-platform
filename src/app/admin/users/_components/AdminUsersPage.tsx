"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { User } from "@prisma/client";
import {
	ArrowLeft,
	Edit,
	Eye,
	Filter,
	Mail,
	Plus,
	Search,
	Shield,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// interface User {
// 	id: string;
// 	name: string;
// 	email: string;
// 	emailVerified: boolean;
// 	image: string | null;
// 	username: string | null;
// 	role: string;
// 	createdAt: string;
// 	updatedAt: string;
// }

export default function AdminUsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const response = await apiFetch("/api/admin/users");
			if (response.ok) {
				const users = await response.json();
				setUsers(users.users);
			} else {
				toast.error("Erreur lors du chargement des utilisateurs");
			}
			setLoading(false);
		} catch {
			toast.error("Erreur lors du chargement des utilisateurs");
			setLoading(false);
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
			return;
		}

		try {
			const response = await apiFetch(`/api/admin/users/${userId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Utilisateur supprimé avec succès");
				fetchUsers();
			} else {
				toast.error("Erreur lors de la suppression de l'utilisateur");
			}
		} catch {
			toast.error("Erreur lors de la suppression de l'utilisateur");
		}
	};

	// const filteredUsers = users

	// .filter(
	// 	(user) =>
	// 		user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
	// 		user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
	// 		user.username?.toLowerCase().includes(searchTerm.toLowerCase())
	// );

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-4">
							<Link href="/admin">
								<Button
									variant="outline"
									size="sm"
									className="flex items-center space-x-2 cursor-pointer"
								>
									<ArrowLeft size={16} />
									<span>Retour</span>
								</Button>
							</Link>
							<h1 className="text-xl font-semibold text-gray-900">
								Gestion des utilisateurs
							</h1>
						</div>
						<Button className="flex items-center space-x-2">
							<Plus size={16} />
							<span>Ajouter un utilisateur</span>
						</Button>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Card>
					<CardHeader>
						<CardTitle>Utilisateurs</CardTitle>
						<CardDescription>
							Gérez les comptes utilisateurs de votre plateforme
						</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Search and Filter */}
						<div className="flex space-x-4 mb-6">
							<div className="relative flex-1">
								<Search
									className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={16}
								/>
								<Input
									type="text"
									placeholder="Rechercher un utilisateur..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="pl-10"
								/>
							</div>
							<Button
								variant="outline"
								className="flex items-center space-x-2"
							>
								<Filter size={16} />
								<span>Filtrer</span>
							</Button>
						</div>

						{/* Users Table */}
						{loading ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
								<p className="mt-2 text-gray-600">
									Chargement...
								</p>
							</div>
						) : users.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								{searchTerm
									? "Aucun utilisateur trouvé"
									: "Aucun utilisateur disponible"}
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full border-collapse border border-gray-200">
									<thead>
										<tr className="bg-gray-50">
											<th className="border border-gray-200 px-4 py-2 text-left">
												Photo
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Nom
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Email
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Rôle
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Vérifié
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Supprimé?
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Date d&apos;inscription
											</th>
											<th className="border border-gray-200 px-4 py-2 text-left">
												Actions
											</th>
										</tr>
									</thead>
									<tbody>
										{users.map((user) => (
											<tr
												key={user.id}
												className="hover:bg-gray-50"
											>
												<td className="border border-gray-200 px-4 py-2">
													<div className="flex items-center space-x-3">
														<div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
															{/* eslint-disable-next-line @next/next/no-img-element */}
															<img
																src={
																	user.image ||
																	"/images/profile_default.webp"
																}
																alt={user.name}
																className="w-10 h-10 rounded-full object-cover"
															/>
														</div>
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2 whitespace-nowrap">
													<div className="font-medium">
														{user.name}
													</div>
													<div className="text-sm text-gray-500">
														@
														{user.username ||
															"sans-pseudo"}
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div className="flex items-center space-x-2">
														<Mail
															size={14}
															className="text-gray-400"
														/>
														<span>
															{user.email}
														</span>
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div className="flex items-center space-x-2">
														<Shield
															size={14}
															className="text-gray-400"
														/>
														<span
															className={`px-2 py-1 text-xs rounded-full ${
																user.role ===
																"admin"
																	? "bg-red-100 text-red-800"
																	: user.role ===
																		  "moderator"
																		? "bg-yellow-100 text-yellow-800"
																		: "bg-blue-100 text-blue-800"
															}`}
														>
															{user.role}
														</span>
													</div>
												</td>
												<td className="border border-gray-200 px-4 py-2 w-full">
													<span
														className={`px-2 py-1 text-xs rounded-full ${
															user.emailVerified
																? "bg-green-100 text-green-800"
																: "bg-orange-100 text-orange-800"
														}`}
													>
														{user.emailVerified
															? "Vérifié"
															: "Non vérifié"}
													</span>
												</td>
												<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
													{user.deletedAt
														? new Date(
																user.deletedAt
															).toLocaleString()
														: "Non supprimé"}
												</td>
												<td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
													{new Date(
														user.createdAt
													).toLocaleString()}
												</td>
												<td className="border border-gray-200 px-4 py-2">
													<div className="flex space-x-2">
														<Button
															variant="outline"
															size="sm"
															className="flex items-center space-x-1"
														>
															<Eye size={14} />
															<span>Voir</span>
														</Button>
														<Button
															variant="outline"
															size="sm"
															className="flex items-center space-x-1"
														>
															<Edit size={14} />
															<span>
																Modifier
															</span>
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																handleDeleteUser(
																	user.id
																)
															}
															className="flex items-center space-x-1 text-red-600 hover:text-red-700"
														>
															<Trash2 size={14} />
															<span>
																Supprimer
															</span>
														</Button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
