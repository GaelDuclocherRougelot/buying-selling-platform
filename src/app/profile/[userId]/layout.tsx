import Footer from "@/components/global/Footer";
import Header from "@/components/global/Header";
import { Metadata } from "next";

interface ProfileLayoutProps {
	children: React.ReactNode;
	params: Promise<{ userId: string }>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ userId: string }>;
}): Promise<Metadata> {
	const { userId } = await params;

	return {
		title: `Profil utilisateur ${userId} | Plateforme d'achat-vente`,
		description: `Découvrez les produits de cet utilisateur sur notre plateforme d'achat-vente.`,
		openGraph: {
			title: `Profil utilisateur ${userId} | Plateforme d'achat-vente`,
			description: `Découvrez les produits de cet utilisateur sur notre plateforme d'achat-vente.`,
			type: "profile",
		},
	};
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
	return (
		<>
			<Header />
			<main className="flex flex-col items-center min-h-screen p-0">
				{children}
			</main>
			<Footer />
		</>
	);
}
