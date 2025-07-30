import { apiFetch } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface StripeStatus {
	hasStripeAccount: boolean;
	stripeAccountStatus:
		| "none"
		| "pending"
		| "active"
		| "restricted"
		| "disabled";
	canSell: boolean;
}

export const useStripeSellerCheck = () => {
	const { data: session } = useSession();
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);
	const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);

	useEffect(() => {
		const checkStripeStatus = async () => {
			if (!session?.user) {
				setIsChecking(false);
				return;
			}

			try {
				const response = await apiFetch("/api/stripe/stripe-status");
				if (!response.ok) {
					throw new Error("Failed to check Stripe status");
				}

				const data = await response.json();
				setStripeStatus(data);

				if (!data.hasStripeAccount) {
					toast.error(
						"Vous devez créer un compte vendeur Stripe pour publier des annonces"
					);
					router.push("/auth/profile");
					return;
				}

				if (
					data.stripeAccountStatus !== "active" &&
					data.stripeAccountStatus !== "charges_only"
				) {
					toast.error(
						"Votre compte vendeur Stripe doit être activé pour publier des annonces"
					);
					router.push("/auth/profile");
					return;
				}

				setIsChecking(false);
			} catch (error) {
				console.error("Error checking Stripe status:", error);
				toast.error(
					"Erreur lors de la vérification de votre compte vendeur"
				);
				router.push("/auth/profile");
			}
		};

		checkStripeStatus();
	}, [session?.user, router]);

	return {
		isChecking,
		stripeStatus,
		canAccess: !isChecking && stripeStatus?.canSell,
	};
};
