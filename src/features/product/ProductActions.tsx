"use client";

import StartConversationButton from "@/components/messages/StartConversationButton";
import PaymentButton from "@/components/stripe/PaymentButton";
import Heart from "@/components/svg/Heart";
import { Button } from "@/components/ui/button";
import FavoriteButton from "@/components/ui/FavoriteButton";
import Link from "next/link";

interface ProductActionsProps {
	productId: string;
	sellerId: string;
	sellerName: string;
	price: number;
	productTitle: string;
	status: string;
	isOwner: boolean;
}

export default function ProductActions({
	productId,
	sellerId,
	sellerName,
	price,
	productTitle,
	status,
	isOwner,
}: ProductActionsProps) {
	if (isOwner) {
		return (
			<div className="flex items-center gap-4">
				<Link href="/auth/profile">
					<Button variant="outline" className="cursor-pointer">
						Gérer mes annonces
					</Button>
				</Link>
			</div>
		);
	}

	if (status === "sold") {
		return (
			<div className="flex items-center gap-4">
				<StartConversationButton
					productId={productId}
					sellerId={sellerId}
					sellerName={sellerName}
					className="px-6 py-2"
				/>
				<Button variant="outline" disabled>
					Produit vendu
				</Button>
				<Button>
					<Heart />
				</Button>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-4">
			<StartConversationButton
				productId={productId}
				sellerId={sellerId}
				sellerName={sellerName}
				className="px-6 py-2"
			/>
			<PaymentButton
				productId={productId}
				amount={price}
				productTitle={productTitle}
			/>
			<FavoriteButton
				productId={productId}
				size="sm"
				className="cursor-pointer"
			/>
		</div>
	);
}
