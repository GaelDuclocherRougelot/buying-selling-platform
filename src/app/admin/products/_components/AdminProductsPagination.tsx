import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationInfo } from "./types";

interface AdminProductsPaginationProps {
	pagination: PaginationInfo;
	onPageChange: (page: number) => void;
}

export function AdminProductsPagination({
	pagination,
	onPageChange,
}: AdminProductsPaginationProps) {
	return (
		<div className="flex items-center justify-between mt-6">
			<div className="text-sm text-gray-700">
				Affichage de{" "}
				{(pagination.currentPage - 1) * pagination.productsPerPage + 1}{" "}
				à{" "}
				{Math.min(
					pagination.currentPage * pagination.productsPerPage,
					pagination.totalProducts
				)}{" "}
				sur {pagination.totalProducts} produits
			</div>
			<div className="flex items-center space-x-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(pagination.currentPage - 1)}
					disabled={!pagination.hasPreviousPage}
					className="flex items-center space-x-1"
				>
					<ChevronLeft size={16} />
					<span>Précédent</span>
				</Button>

				<div className="flex items-center space-x-1">
					{Array.from(
						{ length: Math.min(5, pagination.totalPages) },
						(_, i) => {
							const pageNum = i + 1;
							return (
								<Button
									key={pageNum}
									variant={
										pageNum === pagination.currentPage
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => onPageChange(pageNum)}
									className="w-8 h-8 p-0"
								>
									{pageNum}
								</Button>
							);
						}
					)}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(pagination.currentPage + 1)}
					disabled={!pagination.hasNextPage}
					className="flex items-center space-x-1"
				>
					<span>Suivant</span>
					<ChevronRight size={16} />
				</Button>
			</div>
		</div>
	);
}
