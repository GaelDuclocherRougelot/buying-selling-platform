"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SmartTrackingSimulation } from "@/services/smart-tracking-simulation";
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle,
	Clock,
	Truck,
	Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ShippingProofFormProps {
	paymentId: string;
	productTitle: string;
	buyerName: string;
}

interface ProofData {
	id: string;
	proofType: string;
	proofData: {
		trackingNumber: string;
		receiptImageUrl: string;
		packageImageUrl: string;
		description?: string;
		submittedAt: string;
	};
	status: string;
	submittedAt: string;
	verifiedAt?: string;
}

export default function ShippingProofForm({
	paymentId,
	productTitle,
	buyerName,
}: ShippingProofFormProps) {
	const [trackingNumber, setTrackingNumber] = useState<string>("");
	const [receiptImage, setReceiptImage] = useState<File | null>(null);
	const [packageImage, setPackageImage] = useState<File | null>(null);
	const [description, setDescription] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [existingProof, setExistingProof] = useState<ProofData | null>(null);
	const [uploadProgress, setUploadProgress] = useState<{
		receipt: boolean;
		package: boolean;
	}>({ receipt: false, package: false });
	const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);
	const [isValidTracking, setIsValidTracking] = useState<boolean>(false);

	// Effet pour détecter automatiquement le transporteur
	useEffect(() => {
		if (trackingNumber.trim().length >= 10) {
			const isValid =
				SmartTrackingSimulation.isValidTrackingNumber(trackingNumber);
			setIsValidTracking(isValid);

			if (isValid) {
				// Utilisation d'une méthode publique pour détecter le transporteur
				const carrier = detectCarrierFromTracking(trackingNumber);
				setDetectedCarrier(carrier);
				setError(null);
			} else {
				setDetectedCarrier(null);
				setError("Format de numéro de suivi non reconnu");
			}
		} else {
			setDetectedCarrier(null);
			setIsValidTracking(false);
			setError(null);
		}
	}, [trackingNumber]);

	// Fonction helper pour détecter le transporteur (reproduit la logique privée)
	const detectCarrierFromTracking = (trackingNumber: string): string => {
		const number = trackingNumber.toUpperCase();

		// Formats La Poste/Colissimo
		if (
			number.match(/^[0-9]{13}$/) ||
			number.match(/^[A-Z]{2}[0-9]{9}[A-Z]{2}$/) ||
			number.match(/^[0-9]{10}$/)
		) {
			return "La Poste";
		}

		// Formats Chronopost
		if (
			number.match(/^[0-9]{10}$/) ||
			number.match(/^[A-Z]{2}[0-9]{8}[A-Z]{2}$/)
		) {
			return "Chronopost";
		}

		// Formats DHL
		if (
			number.match(/^[0-9]{10}$/) ||
			number.match(/^[A-Z]{3}[0-9]{10}$/)
		) {
			return "DHL";
		}

		// Par défaut, La Poste
		return "La Poste";
	};

	// Fonction pour uploader une image vers Cloudinary
	const uploadImageToCloudinary = async (
		file: File,
		type: "receipt" | "package"
	) => {
		try {
			setUploadProgress((prev) => ({ ...prev, [type]: true }));

			const formData = new FormData();
			formData.append("files", file);

			const response = await fetch("/api/upload/proof-pictures", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erreur lors de l'upload");
			}

			const data = await response.json();
			setUploadProgress((prev) => ({ ...prev, [type]: false }));

			return data.urls[0]; // Retourne l'URL de l'image uploadée
		} catch (err) {
			setUploadProgress((prev) => ({ ...prev, [type]: false }));
			throw err;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation : toutes les preuves sont requises
		if (!trackingNumber.trim()) {
			setError("Numéro de suivi requis");
			return;
		}

		if (!isValidTracking) {
			setError("Numéro de suivi invalide ou format non reconnu");
			return;
		}

		if (!receiptImage) {
			setError("Photo du reçu d'affranchissement requise");
			return;
		}

		if (!packageImage) {
			setError("Photo du colis emballé requise");
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			// Upload des images vers Cloudinary
			const [receiptImageUrl, packageImageUrl] = await Promise.all([
				uploadImageToCloudinary(receiptImage, "receipt"),
				uploadImageToCloudinary(packageImage, "package"),
			]);

			// Combinaison de preuves avec URLs Cloudinary
			const proofData = {
				trackingNumber: trackingNumber.trim(),
				carrier: detectedCarrier,
				receiptImageUrl,
				packageImageUrl,
				description,
				submittedAt: new Date().toISOString(),
			};

			const response = await fetch("/api/shipping/proof", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					paymentId,
					proofType: "complete_proof",
					proofData,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Erreur lors de la soumission"
				);
			}

			const data = await response.json();
			setExistingProof(data.proof);
			setSuccess("Preuve d'expédition complète soumise avec succès !");

			// Reset form
			setTrackingNumber("");
			setReceiptImage(null);
			setPackageImage(null);
			setDescription("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur inconnue");
		} finally {
			setLoading(false);
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "verified":
				return <CheckCircle className="h-5 w-5 text-green-500" />;
			case "rejected":
				return <AlertCircle className="h-5 w-5 text-red-500" />;
			default:
				return <Clock className="h-5 w-5 text-orange-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "verified":
				return "bg-green-100 text-green-800";
			case "rejected":
				return "bg-red-100 text-red-800";
			default:
				return "bg-orange-100 text-orange-800";
		}
	};

	const getStatusLabel = (status: string) => {
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
		<Card className="w-full max-w-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-5 w-5" />
					Preuve d&apos;expédition complète
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Informations de la commande */}
				<div className="p-4 bg-gray-50 rounded-lg">
					<h3 className="font-medium mb-2">Détails de la commande</h3>
					<div className="text-sm space-y-1">
						<p>
							<strong>Produit :</strong> {productTitle}
						</p>
						<p>
							<strong>Acheteur :</strong> {buyerName}
						</p>
						<p>
							<strong>ID Paiement :</strong> {paymentId}
						</p>
					</div>
				</div>

				{/* Alerte importante */}
				<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<div className="flex items-center gap-2 mb-2">
						<AlertTriangle className="h-5 w-5 text-yellow-600" />
						<h4 className="font-medium text-yellow-800">
							Important
						</h4>
					</div>
					<p className="text-sm text-yellow-700">
						<strong>Toutes les preuves sont obligatoires</strong>{" "}
						pour débloquer le paiement :
					</p>
					<ul className="text-sm text-yellow-700 mt-2 space-y-1">
						<li>
							• Numéro de suivi (La Poste, Chronopost, DHL
							supportés)
						</li>
						<li>
							• Photo du reçu d&apos;affranchissement (preuve de
							paiement)
						</li>
						<li>
							• Photo du colis emballé (preuve d&apos;emballage)
						</li>
					</ul>
				</div>

				{error && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-md">
						<p className="text-red-600 text-sm">{error}</p>
					</div>
				)}

				{success && (
					<div className="p-3 bg-green-50 border border-green-200 rounded-md">
						<p className="text-green-600 text-sm">{success}</p>
					</div>
				)}

				{/* Preuve existante */}
				{existingProof && (
					<div className="p-4 border rounded-lg">
						<div className="flex items-center justify-between mb-2">
							<h4 className="font-medium">Preuve soumise</h4>
							<Badge
								className={getStatusColor(existingProof.status)}
							>
								{getStatusLabel(existingProof.status)}
							</Badge>
						</div>
						<div className="flex items-center gap-2 text-sm text-gray-600">
							{getStatusIcon(existingProof.status)}
							<span>
								Soumise le{" "}
								{new Date(
									existingProof.submittedAt
								).toLocaleDateString("fr-FR")}
							</span>
						</div>
						{existingProof.verifiedAt && (
							<p className="text-sm text-gray-600 mt-1">
								Vérifiée le{" "}
								{new Date(
									existingProof.verifiedAt
								).toLocaleDateString("fr-FR")}
							</p>
						)}
					</div>
				)}

				{/* Formulaire de soumission */}
				{!existingProof && (
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Numéro de suivi */}
						<div className="space-y-2">
							<Label htmlFor="trackingNumber">
								Numéro de suivi *
							</Label>
							<Input
								id="trackingNumber"
								value={trackingNumber}
								onChange={(e) =>
									setTrackingNumber(e.target.value)
								}
								placeholder="Ex: 1A2B3C4D5E6F ou LT123456789FR"
								required
								className={
									isValidTracking &&
									trackingNumber.length >= 10
										? "border-green-300"
										: ""
								}
							/>

							{/* Affichage du transporteur détecté */}
							{detectedCarrier && isValidTracking && (
								<div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
									<Truck className="h-4 w-4 text-green-600" />
									<span className="text-sm text-green-700">
										<strong>Transporteur détecté :</strong>{" "}
										{detectedCarrier}
									</span>
								</div>
							)}

							<p className="text-xs text-gray-500">
								Supporte La Poste, Chronopost et DHL - Détection
								automatique
							</p>
						</div>

						{/* Photo du reçu */}
						<div className="space-y-2">
							<Label htmlFor="receiptImage">
								Photo du reçu d&apos;affranchissement *
							</Label>
							<Input
								id="receiptImage"
								type="file"
								accept="image/*"
								onChange={(e) =>
									setReceiptImage(e.target.files?.[0] || null)
								}
								required
							/>
							<p className="text-xs text-gray-500">
								Preuve que vous avez payé
								l&apos;affranchissement
							</p>
							{uploadProgress.receipt && (
								<p className="text-xs text-blue-600">
									⏳ Upload en cours...
								</p>
							)}
						</div>

						{/* Photo du colis */}
						<div className="space-y-2">
							<Label htmlFor="packageImage">
								Photo du colis emballé *
							</Label>
							<Input
								id="packageImage"
								type="file"
								accept="image/*"
								onChange={(e) =>
									setPackageImage(e.target.files?.[0] || null)
								}
								required
							/>
							<p className="text-xs text-gray-500">
								Montrez le colis avec l&apos;étiquette
								d&apos;adresse
							</p>
							{uploadProgress.package && (
								<p className="text-xs text-blue-600">
									⏳ Upload en cours...
								</p>
							)}
						</div>

						{/* Description optionnelle */}
						<div className="space-y-2">
							<Label htmlFor="description">
								Description (optionnel)
							</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Ajoutez des détails sur l'expédition..."
							/>
						</div>

						<Button
							type="submit"
							disabled={loading}
							className="w-full"
						>
							{loading
								? "Soumission..."
								: "Soumettre la preuve complète"}
						</Button>
					</form>
				)}

				{/* Informations de sécurité */}
				<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h4 className="font-medium text-blue-800 mb-2">
						Sécurité renforcée
					</h4>
					<ul className="text-sm text-blue-700 space-y-1">
						<li>
							• Détection automatique du transporteur (La Poste,
							Chronopost, DHL)
						</li>
						<li>• Validation du format du numéro de suivi</li>
						<li>• Contrôle manuel des photos par notre équipe</li>
						<li>• Paiement débloqué uniquement après validation</li>
						<li>• Suspension en cas de fraude détectée</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	);
}
