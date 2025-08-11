import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AdminProductsHeader() {
	return (
		<header className="bg-white shadow-sm border-b">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center space-x-4">
						<Link href="/admin">
							<Button
								variant="outline"
								size="sm"
								className="flex items-center space-x-2 cursor-pointer"
							>
								<ArrowLeft size={16} />
								<span>Retour</span>
							</Button>
						</Link>
						<h1 className="text-xl font-semibold text-gray-900">
							Gestion des produits
						</h1>
					</div>
				</div>
			</div>
		</header>
	);
}
