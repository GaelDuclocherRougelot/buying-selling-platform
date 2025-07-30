export interface Product {
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
	onEditClick?: (product: Product) => void;
	onDeleteClick?: (product: Product) => void;
	onToggleStatusClick?: (product: Product) => void;
}
