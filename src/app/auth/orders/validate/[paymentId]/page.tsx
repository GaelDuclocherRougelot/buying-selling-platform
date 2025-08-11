import PaymentStatus from "@/components/payment/PaymentStatus";

interface PageProps {
	params: Promise<{ paymentId: string }>;
}

export default async function ValidateOrderPage({ params }: PageProps) {
	const { paymentId } = await params;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Valider votre commande
					</h1>
					<p className="text-gray-600">
						Confirmez la réception de votre produit pour finaliser
						la transaction.
					</p>
				</div>

				<PaymentStatus paymentId={paymentId} />

				{/* Informations sur le processus */}
				<div className="mt-8 bg-green-50 p-6 rounded-lg">
					<h2 className="font-semibold text-green-800 mb-4">
						✅ Validation de commande
					</h2>
					<div className="space-y-3 text-green-700">
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
								1
							</span>
							<p>Vérifiez que vous avez bien reçu le produit</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
								2
							</span>
							<p>
								Assurez-vous que le produit correspond à la
								description
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
								3
							</span>
							<p>
								Cliquez sur &ldquo;Valider la réception&rdquo;
								pour confirmer
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
								4
							</span>
							<p>Le vendeur recevra immédiatement le paiement</p>
						</div>
					</div>
				</div>

				{/* Aide */}
				<div className="mt-6 bg-blue-50 p-6 rounded-lg">
					<h3 className="font-semibold text-blue-800 mb-3">
						🤔 Besoin d&apos;aide ?
					</h3>
					<div className="text-blue-700 space-y-2">
						<p>
							<strong>Problème avec le produit ?</strong> Si le
							produit ne correspond pas à la description ou
							présente des défauts, contactez le vendeur avant de
							valider.
						</p>
						<p>
							<strong>Produit non reçu ?</strong> Ne validez pas
							la réception si vous n&apos;avez pas encore reçu le
							produit.
						</p>
						<p>
							<strong>Livraison en main propre ?</strong> Utilisez
							le système de validation détaillé qui vous permet
							d&apos;accepter ou de refuser le produit.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
