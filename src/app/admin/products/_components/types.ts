import { Category } from "@prisma/client";

export interface Product {
	id: string;
	title: string;
	description: string | null;
	price: number;
	condition: string;
	imagesUrl: string[];
	categoryId: string;
	createdAt: string;
	updatedAt: string;
	status: string;
	category: Category;
}

export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	totalProducts: number;
	productsPerPage: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface EditProductForm {
	title: string;
	description: string;
	price: number;
	condition: string;
	status: string;
	categoryId: string;
	imagesUrl: string[];
}

export interface ShippingProof {
	id: string;
	paymentId: string;
	proofType: string;
	proofData: {
		trackingNumber: string;
		receiptImageUrl: string;
		packageImageUrl: string;
		description?: string;
		submittedAt: string;
	};
	status: string;
	submittedAt: string;
	verifiedAt?: string;
	verifiedBy?: string;
}

export interface Payment {
	id: string;
	amount: number;
	status: string;
	productId: string;
	buyerId: string;
	sellerId: string;
	createdAt: string;
	product: Product;
	buyer: {
		id: string;
		username: string;
		email: string;
	};
	seller: {
		id: string;
		username: string;
		email: string;
	};
}
