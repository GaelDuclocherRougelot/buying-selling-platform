"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProductCardWithSeller from "@/features/product/ProductCardWithSeller";
import { apiFetch } from "@/lib/api";
import { Calendar, Package, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface User {
	id: string;
	name: string;
	username: string | null;
	displayUsername: string | null;
	image: string | null;
	createdAt: string;
}

interface Product {
	id: string;
	title: string;
	description: string | null;
	price: number;
	condition: string;
	imagesUrl: string[];
	status: string;
	category: {
		id: string;
		displayName: string;
	};
	createdAt: string;
}

interface ProfilePageProps {
	params: Promise<{ userId: string }>;
}

// Note: Since this is a client component, we can't use generateMetadata
// The metadata will be handled by the layout or a separate server component if needed

export default function ProfilePage({ params }: ProfilePageProps) {
	const [user, setUser] = useState<User | null>(null);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const { userId } = await params;

				// Fetch user data
				const userResponse = await apiFetch(`/api/users/${userId}`);
				if (!userResponse.ok) {
					toast.error("Utilisateur non trouvé");
					return;
				}
				const userData = await userResponse.json();
				setUser(userData);

				// Fetch user products
				const productsResponse = await apiFetch(
					`/api/products/user/${userId}`
				);
				if (productsResponse.ok) {
					const productsData = await productsResponse.json();
					// Filter out sold products for public profile
					const activeProducts = productsData.filter(
						(product: Product) => product.status !== "sold"
					);
					setProducts(activeProducts);
				}
			} catch (error) {
				console.error("Error fetching profile data:", error);
				toast.error("Erreur lors du chargement du profil");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [params]);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("fr-FR", {
			year: "numeric",
			month: "long",
		});
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	if (loading) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<div className="max-w-7xl mx-auto py-8 px-4 sm:px-4 lg:px-10">
					<div className="text-center">
						<p className="mt-4 text-gray-600">
							Chargement du profil...
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="bg-gray-50 min-h-screen">
				<div className="max-w-7xl mx-auto py-8 px-4 sm:px-4 lg:px-10">
					<div className="text-center">
						<User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							Utilisateur non trouvé
						</h3>
						<p className="text-gray-600 mb-6">
							L&apos;utilisateur que vous recherchez n&apos;existe
							pas ou a été supprimé.
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<section className="max-w-[85rem] mx-auto py-6 px-4 lg:px-100 w-full">
			<div className="max-w-7xl mx-auto py-8 px-4">
				{/* Profile Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-8">
					<div className="flex items-center gap-4">
						<Avatar className="w-fit h-fit">
							<AvatarImage
								src={user.image || ""}
								alt={user.name}
								className="w-16 h-16"
							/>
							<AvatarFallback className="text-lg">
								{getInitials(user.name)}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1">
							<h1 className="text-2xl font-bold text-gray-900">
								{"@" + user.displayUsername ||
									"@" + user.username ||
									user.name}
							</h1>
							<div className="flex items-center gap-4 space-x-6 mt-2 text-sm text-gray-500">
								<div className="flex items-center space-x-1">
									<Calendar className="h-4 w-4" />
									<span>
										Membre depuis{" "}
										{formatDate(user.createdAt)}
									</span>
								</div>
								<div className="flex items-center space-x-1">
									<Package className="h-4 w-4" />
									<span>
										{products.length} produit
										{products.length !== 1 ? "s" : ""}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Products Section */}
				<div>
					<h2 className="text-xl font-semibold text-gray-900 mb-6">
						Produits de{" "}
						{user.displayUsername || user.username || user.name}
					</h2>

					{products.length === 0 ? (
						<div className="bg-white rounded-lg shadow-sm p-8 text-center">
							<Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								Aucun produit disponible
							</h3>
							<p className="text-gray-600">
								Cet utilisateur n&apos;a pas encore publié de
								produits.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{products.map((product) => (
								<ProductCardWithSeller
									key={product.id}
									title={product.title}
									description={product.description}
									price={product.price}
									imageUrl={
										product.imagesUrl[0] ||
										"/images/product_default.webp"
									}
									category={product.category.id}
									productId={product.id}
									seller={{
										id: user.id,
										username: user.username,
										name: user.name,
									}}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
