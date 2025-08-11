import PaymentStatus from "@/components/payment/PaymentStatus";

interface PageProps {
	params: Promise<{ paymentId: string }>;
}

export default async function BuyerValidationPage({ params }: PageProps) {
	const { paymentId } = await params;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Validation de votre achat
					</h1>
					<p className="text-gray-600">
						Vous avez reçu votre produit en main propre. Veuillez
						valider si celui-ci correspond à vos attentes.
					</p>
				</div>

				<PaymentStatus paymentId={paymentId} />

				{/* Informations sur le processus */}
				<div className="mt-8 bg-blue-50 p-6 rounded-lg">
					<h2 className="font-semibold text-blue-800 mb-4">
						📘 Comment ça fonctionne ?
					</h2>
					<div className="space-y-3 text-blue-700">
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
								1
							</span>
							<p>
								Vous avez effectué l&apos;achat d&apos;un produit avec
								livraison &quot;en main propre&quot;
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
								2
							</span>
							<p>
								Vous avez rencontré le vendeur et reçu le
								produit
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
								3
							</span>
							<p>
								Vérifiez que le produit correspond à la
								description et acceptez ou refusez
							</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
								4
							</span>
							<p>
								En cas d&apos;acceptation, le vendeur recevra le
								paiement. En cas de refus, vous serez remboursé.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
