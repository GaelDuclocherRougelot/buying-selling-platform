import Header from "@/components/global/Header";
import PaymentButton from "@/components/stripe/PaymentButton";
import Heart from "@/components/svg/Heart";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import VerifiedUser from "@/components/ui/verified-user";
import ProductImageCarousel from "@/features/product/ProductImageCarousel";
import ProductNavBar from "@/features/product/ProductNavBar";
import { createApiURL } from "@/lib/api";
import { getUser } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ category: string; productId: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;

	try {
		const productResponse = await fetch(
			createApiURL(`/api/products/${resolvedParams.productId}`),
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!productResponse.ok) {
			return {
				title: "Produit non trouvé",
				description:
					"Le produit que vous recherchez n'existe pas ou a été supprimé.",
			};
		}

		const product = await productResponse.json();

		return {
			title: product.title,
			description:
				product.description ||
				`Découvrez ${product.title} à ${product.price}€. Achetez en toute sécurité sur notre plateforme.`,
			keywords: [
				product.title,
				product.category?.name,
				"achat",
				"vente",
				"produit",
				"prix",
			],
			openGraph: {
				title: `${product.title} - ${product.price}€`,
				description:
					product.description ||
					`Découvrez ${product.title} à ${product.price}€.`,
				url: `/products/${resolvedParams.category}/${resolvedParams.productId}`,
				images:
					product.imagesUrl?.length > 0
						? [
								{
									url: product.imagesUrl[0],
									width: 800,
									height: 600,
									alt: product.title,
								},
							]
						: undefined,
			},
			twitter: {
				title: `${product.title} - ${product.price}€`,
				description:
					product.description ||
					`Découvrez ${product.title} à ${product.price}€.`,
				images:
					product.imagesUrl?.length > 0
						? [product.imagesUrl[0]]
						: undefined,
			},
		};
	} catch {
		return {
			title: "Erreur",
			description:
				"Une erreur s'est produite lors du chargement du produit.",
		};
	}
}

/**
 * ProductPage component displays the details of a specific product.
 * It includes a header, product navigation bar, and product details section.
 *
 * @param {Object} props - Component properties
 * @param {Promise<{ category: string; productId: string }>} props.params - Promise resolving to the product parameters
 * @returns {JSX.Element} The ProductPage component
 */
export default async function ProductPage(props: {
	params: Promise<{ category: string; productId: string }>;
}) {
	const params = await props.params;
	const chatId = "123456789";

	// Récupérer l'utilisateur connecté
	const currentUser = await getUser();

	// Construct the full URL for the API request
	const productResponse = await fetch(
		createApiURL(`/api/products/${params.productId}`),
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		}
	);

	const product = await productResponse.json();

	console.log(product);

	// Vérifier si l'utilisateur connecté est le propriétaire de l'annonce
	const isOwner = currentUser?.id === product.ownerId;

	return (
		<>
			<Header />
			<ProductNavBar
				image={product.imagesUrl[0]}
				title={product.title}
				price={product.price}
				chatId="123456789"
			/>
			<main className="flex flex-col items-center justify-center p-0">
				<section className="max-w-[85rem] mx-auto py-16 px-4 lg:px-10 w-full flex flex-col gap-6">
					<div
						className={cn(
							"py-4 flex items-center justify-between w-full"
						)}
					>
						<div className="flex items-center space-x-4">
							<Avatar className="h-16 w-16">
								<AvatarImage
									src={product.owner.image}
									className="object-cover"
									alt="User Avatar"
								/>
							</Avatar>
							<div className="text-lg font-semibold">
								<CardTitle className="flex gap-2">
									<Link
										href={`/profile/${product.owner.id}`}
										className="hover:text-blue-600 transition-colors"
									>
										{product.owner.username ||
											product.owner.name}
									</Link>
									{product.owner.emailVerified && (
										<VerifiedUser />
									)}
								</CardTitle>
							</div>
						</div>
						{!isOwner && (
							<div className="flex items-center gap-4">
								<Link href={`/auth/chat/${chatId}`}>
									<Button variant="default">
										Contacter le vendeur
									</Button>
								</Link>
								<PaymentButton
									productId={product.id}
									amount={product.price}
									productTitle={product.title}
								/>
								<Button>
									<Heart />
								</Button>
							</div>
						)}
						{isOwner && (
							<div className="flex items-center gap-4">
								<Link href="/auth/profile">
									<Button
										variant="outline"
										className="cursor-pointer"
									>
										Gérer mes annonces
									</Button>
								</Link>
							</div>
						)}
					</div>
					<hr />
					<ProductImageCarousel images={product.imagesUrl} />
					<div className="flex flex-col gap-6 items-start justify-start max-w-2xl">
						<div className="flex flex-col gap-2">
							<h1>{product.title}</h1>
							<p className="text-xl">{product.price}€</p>
						</div>
						<div className="flex flex-col gap-2">
							<h2>Description</h2>
							<p>{product.description}</p>
						</div>
						<div>
							<h2>Lieu</h2>
							<p>{product.city}</p>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
