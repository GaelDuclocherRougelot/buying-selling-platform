import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertCircle,
	CheckCircle,
	Clock,
	Package,
	Receipt,
	Truck,
	X,
} from "lucide-react";
import Image from "next/image";
import { Payment, ShippingProof } from "./types";

interface ShippingProofModalProps {
	isOpen: boolean;
	onClose: () => void;
	shippingProofs: ShippingProof[];
	payments: Payment[];
	loadingProofs: boolean;
	onVerifyProof: (proofId: string, status: "verified" | "rejected") => void;
}

export function ShippingProofModal({
	isOpen,
	onClose,
	shippingProofs,
	payments,
	loadingProofs,
	onVerifyProof,
}: ShippingProofModalProps) {
	const getProofStatusIcon = (status: string) => {
		switch (status) {
			case "verified":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "rejected":
				return <AlertCircle className="h-5 w-5 text-red-500" />;
			default:
				return <Clock className="h-5 w-5 text-orange-500" />;
		}
	};

	const getProofStatusColor = (status: string) => {
		switch (status) {
			case "verified":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-orange-100 text-orange-800";
		}
	};

	const getProofStatusLabel = (status: string) => {
		switch (status) {
			case "verified":
				return "Validée";
			case "rejected":
				return "Rejetée";
			default:
				return "En attente de vérification";
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-h-[500px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						Vérification des expéditions
					</DialogTitle>
					<DialogDescription>
						Vérifiez les preuves d&apos;expédition soumises pour ce
						produit
					</DialogDescription>
				</DialogHeader>

				{loadingProofs ? (
					<div className="text-center py-8">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
						<p className="mt-2 text-gray-600">
							Chargement des preuves...
						</p>
					</div>
				) : shippingProofs.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
						<p>
							Aucune preuve d&apos;expédition trouvée pour ce
							produit
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{(() => {
							const paymentsMap = new Map(
								payments.map((payment) => [payment.id, payment])
							);

							return shippingProofs.map((proof) => {
								const payment = paymentsMap.get(
									proof.paymentId
								);

								return (
									<Card
										key={proof.id}
										className="border-l-4 border-l-orange-500 max-h-[500px]"
									>
										<CardHeader>
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													{getProofStatusIcon(
														proof.status
													)}
													<div>
														<h3 className="font-semibold">
															Preuve
															d&apos;expédition #
															{proof.id.slice(-6)}
														</h3>
														<p className="text-sm text-gray-600">
															Paiement:{" "}
															{proof.paymentId.slice(
																-6
															)}{" "}
															- {payment?.amount}€
														</p>
													</div>
												</div>
												<Badge
													className={getProofStatusColor(
														proof.status
													)}
												>
													{getProofStatusLabel(
														proof.status
													)}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="space-y-4">
											{/* Informations de la transaction */}
											<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
												<div>
													<h4 className="font-medium mb-2">
														Acheteur
													</h4>
													<p className="text-sm">
														{
															payment?.buyer
																.username
														}
													</p>
													<p className="text-sm text-gray-600">
														{payment?.buyer.email}
													</p>
												</div>
												<div>
													<h4 className="font-medium mb-2">
														Vendeur
													</h4>
													<p className="text-sm">
														{
															payment?.seller
																.username
														}
													</p>
													<p className="text-sm text-gray-600">
														{payment?.seller.email}
													</p>
												</div>
											</div>

											{/* Numéro de suivi */}
											<div className="p-4 border rounded-lg">
												<div className="flex items-center gap-2 mb-2">
													<Truck className="h-4 w-4 text-blue-600" />
													<h4 className="font-medium">
														Numéro de suivi
													</h4>
												</div>
												<code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
													{
														proof.proofData
															.trackingNumber
													}
												</code>
											</div>

											{/* Photos des preuves */}
											<div className="grid grid-cols-2 gap-4">
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<Receipt className="h-4 w-4 text-green-600" />
														<h4 className="font-medium">
															Reçu
															d&apos;affranchissement
														</h4>
													</div>
													<div className="border rounded-lg overflow-hidden w-fit">
														<Image
															src={
																proof.proofData
																	.receiptImageUrl
															}
															alt="Reçu d'affranchissement"
															className="max-w-md h-48 object-cover"
															width={1920}
															height={1080}
														/>
													</div>
												</div>
												<div className="space-y-2">
													<div className="flex items-center gap-2">
														<Package className="h-4 w-4 text-blue-600" />
														<h4 className="font-medium">
															Photo du colis
														</h4>
													</div>
													<div className="border rounded-lg overflow-hidden w-fit">
														<Image
															src={
																proof.proofData
																	.packageImageUrl
															}
															alt="Photo du colis"
															className="max-w-md h-48 object-cover"
															width={1920}
															height={1080}
														/>
													</div>
												</div>
											</div>

											{/* Description */}
											{proof.proofData.description && (
												<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
													<h4 className="font-medium mb-2">
														Description du vendeur
													</h4>
													<p className="text-sm text-gray-700">
														{
															proof.proofData
																.description
														}
													</p>
												</div>
											)}

											{/* Informations temporelles */}
											<div className="text-sm text-gray-600 space-y-1">
												<p>
													Soumise le:{" "}
													{new Date(
														proof.submittedAt
													).toLocaleDateString(
														"fr-FR",
														{
															day: "numeric",
															month: "long",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														}
													)}
												</p>
												{proof.verifiedAt && (
													<p>
														Vérifiée le:{" "}
														{new Date(
															proof.verifiedAt
														).toLocaleDateString(
															"fr-FR",
															{
																day: "numeric",
																month: "long",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit",
															}
														)}
													</p>
												)}
											</div>

											{/* Actions de vérification */}
											{proof.status ===
												"pending_verification" && (
												<div className="flex gap-2 pt-4 border-t">
													<Button
														onClick={() =>
															onVerifyProof(
																proof.id,
																"verified"
															)
														}
														className="flex items-center gap-2"
													>
														<CheckCircle className="h-4 w-4" />
														Valider la preuve
													</Button>
													<Button
														variant="destructive"
														onClick={() =>
															onVerifyProof(
																proof.id,
																"rejected"
															)
														}
														className="flex items-center gap-2"
													>
														<AlertCircle className="h-4 w-4" />
														Rejeter la preuve
													</Button>
												</div>
											)}
										</CardContent>
									</Card>
								);
							});
						})()}
					</div>
				)}

				<div className="flex justify-end pt-4 border-t">
					<Button variant="outline" onClick={onClose}>
						<X size={16} className="mr-2" />
						Fermer
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
