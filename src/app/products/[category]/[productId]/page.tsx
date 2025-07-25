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
import { cn } from "@/lib/utils";
import Link from "next/link";

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
									{product.owner.username ||
										product.owner.name}
									{product.owner.emailVerified && (
										<VerifiedUser />
									)}
								</CardTitle>
							</div>
						</div>
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
