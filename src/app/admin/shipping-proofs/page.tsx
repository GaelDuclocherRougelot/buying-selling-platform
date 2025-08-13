"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ShippingProof {
	id: string;
	status: "pending_verification" | "verified" | "rejected";
	trackingNumber: string;
	carrier: string;
	description: string;
	submittedAt: string;
	packageImageUrl: string;
	receiptImageUrl: string;
	createdAt: string;
	payment: {
		id: string;
		amount: number;
		status: string;
		product: {
			id: string;
			title: string;
			price: number;
		};
		buyer: {
			id: string;
			username: string;
		};
		seller: {
			id: string;
			username: string;
		};
	};
}


export default function ShippingProofsPage() {
	const [proofs, setProofs] = useState<ShippingProof[]>([]);

	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState<string | null>(null);
	

	useEffect(() => {
		fetchProofs();
	}, []);

	const fetchProofs = async () => {
		try {
			const response = await apiFetch("/api/admin/shipping-proofs");
			const data = await response.json();
			setProofs(data.proofs || []);
		} catch (error) {
			console.error("Erreur lors du chargement des preuves:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleValidation = async (
		proofId: string,
		action: "approve" | "reject"
	) => {
		setProcessing(proofId);
		try {
			const response = await apiFetch(
				`/api/admin/shipping-proofs/${proofId}/verify`,
				{
					method: "POST",
					body: JSON.stringify({
						action,
						adminId: "admin", // À remplacer par l'ID de l'admin connecté
					}),
				}
			);

			if (response.ok) {
				// Rafraîchir la liste
				await fetchProofs();
				alert(
					action === "approve"
						? "Preuve approuvée !"
						: "Preuve rejetée !"
				);
			} else {
				const error = await response.json();
				alert(`Erreur: ${error.error}`);
			}
		} catch (error) {
			console.error("Erreur lors de la validation:", error);
			alert("Erreur lors de la validation");
		} finally {
			setProcessing(null);
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending_verification":
				return (
					<Badge variant="secondary">
						En attente de vérification
					</Badge>
				);
			case "verified":
				return <Badge variant="default">Approuvé</Badge>;
			case "rejected":
				return <Badge variant="destructive">Rejeté</Badge>;
			default:
				return <Badge variant="outline">{status}</Badge>;
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto p-6">
				<h1 className="text-2xl font-bold mb-6">
					Preuves d&apos;expédition
				</h1>
				<div className="text-center">Chargement...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">
				Preuves d&apos;expédition
			</h1>

			{proofs.length === 0 ? (
				<Card>
					<CardContent className="p-6">
						<p className="text-center text-muted-foreground">
							Aucune preuve d&apos;expédition en attente de
							validation.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{proofs.map((proof) => (
						<Card key={proof.id}>
							<CardHeader>
								<div className="flex justify-between items-start">
									<div>
										<CardTitle className="text-lg">
											{proof.payment.product.title}
										</CardTitle>
										<p className="text-sm text-muted-foreground">
											{proof.payment.amount}€ -{" "}
											{proof.payment.buyer.username} →{" "}
											{proof.payment.seller.username}
										</p>
									</div>
									{getStatusBadge(proof.status)}
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<h4 className="font-semibold mb-2">
											Informations d&apos;expédition
										</h4>
										<p>
											<strong>Transporteur:</strong>{" "}
											{proof.carrier}
										</p>
										<p>
											<strong>Numéro de suivi:</strong>{" "}
											{proof.trackingNumber}
										</p>
										<p>
											<strong>Date de soumission:</strong>{" "}
											{new Date(
												proof.createdAt
											).toLocaleDateString()}
										</p>
									</div>
									<div className="flex gap-2 items-center">
										{proof.packageImageUrl && (
											<div>
												<h4 className="font-semibold mb-2">
													Preuve d&apos;emballage
												</h4>
												<Image
													src={proof.packageImageUrl}
													alt="Preuve d'emballage"
													className="w-full max-w-md rounded border"
													width={1920}
													height={1080}
												/>
											</div>
										)}
										{proof.receiptImageUrl && (
											<div>
												<h4 className="font-semibold mb-2">
													Preuve
													d&apos;affranchissement
												</h4>
												<Image
													src={proof.receiptImageUrl}
													alt="Preuve d'affranchissement"
													className="w-full max-w-md rounded border"
													width={1920}
													height={1080}
												/>
											</div>
										)}
									</div>
								</div>

								{proof.status === "pending_verification" && (
									<>
										<div className="flex gap-2 mt-4">
											{/* Boutons rapides (ancienne méthode) */}
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="default"
														disabled={
															processing ===
															proof.id
														}
													>
														{processing === proof.id
															? "Traitement..."
															: "Approuver"}
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Approuver la preuve
															d&apos;expédition
														</AlertDialogTitle>
														<AlertDialogDescription>
															Cette action va :
															<ul className="list-disc list-inside mt-2">
																<li>
																	Capturer le
																	paiement et
																	le
																	transférer
																	au vendeur
																</li>
																<li>
																	Marquer le
																	produit
																	comme vendu
																</li>
																<li>
																	Marquer la
																	preuve comme
																	approuvée
																</li>
															</ul>
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Annuler
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																handleValidation(
																	proof.id,
																	"approve"
																)
															}
															className="bg-green-600 hover:bg-green-700"
														>
															Approuver
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>

											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="destructive"
														disabled={
															processing ===
															proof.id
														}
													>
														{processing === proof.id
															? "Traitement..."
															: "Rejeter"}
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Rejeter la preuve
															d&apos;expédition
														</AlertDialogTitle>
														<AlertDialogDescription>
															Cette action va :
															<ul className="list-disc list-inside mt-2">
																<li>
																	Rembourser
																	l&apos;acheteur
																</li>
																<li>
																	Remettre le
																	produit en
																	vente
																</li>
																<li>
																	Marquer la
																	preuve comme
																	rejetée
																</li>
															</ul>
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															Annuler
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																handleValidation(
																	proof.id,
																	"reject"
																)
															}
															className="bg-red-600 hover:bg-red-700"
														>
															Rejeter
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
