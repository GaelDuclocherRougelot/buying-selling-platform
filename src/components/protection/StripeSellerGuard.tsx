import { Card } from "@/components/ui/card";
import { useStripeSellerCheck } from "@/lib/hooks/useStripeSellerCheck";
import { ReactNode } from "react";

interface StripeSellerGuardProps {
	children: ReactNode;
	fallback?: ReactNode;
}

export const StripeSellerGuard = ({
	children,
	fallback,
}: StripeSellerGuardProps) => {
	const { isChecking } = useStripeSellerCheck();

	if (isChecking) {
		return (
			fallback || (
				<div className="flex flex-col items-center justify-center min-h-screen">
					<Card className="flex flex-col gap-10 w-full max-w-[600px] h-fit mx-auto px-6">
						<div className="flex flex-col items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
							<p>Vérification de votre compte vendeur...</p>
						</div>
					</Card>
				</div>
			)
		);
	}

	return <>{children}</>;
};
