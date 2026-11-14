/**
 * @jest-environment node
 */
const destroy = jest.fn().mockResolvedValue({ result: "ok" });
const findMany = jest.fn();
jest.mock("@/lib/cloudinary", () => ({ uploader: { destroy } }));
jest.mock("@/lib/prisma", () => ({ prisma: { product: { findMany } } }));

import { deleteProductImagesFromCloudinary } from "@/lib/cloudinary-utils";

const url = (id: string) =>
	`https://res.cloudinary.com/zone/image/upload/v1/product-pictures/${id}.jpg`;

beforeAll(() => {
	process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "zone";
});

it("ne détruit pas une image encore utilisée par un autre produit", async () => {
	findMany.mockResolvedValue([{ imagesUrl: [url("victime")] }]);

	await deleteProductImagesFromCloudinary("p1", [url("mien"), url("victime")]);

	expect(destroy).toHaveBeenCalledTimes(1);
	expect(destroy).toHaveBeenCalledWith("product-pictures/mien");
});

it("ne détruit rien hors du dossier product-pictures", async () => {
	destroy.mockClear();
	findMany.mockResolvedValue([]);

	await deleteProductImagesFromCloudinary("p1", [
		"https://res.cloudinary.com/zone/image/upload/v1/profile-pictures/u1.jpg",
	]);

	expect(destroy).not.toHaveBeenCalled();
});
