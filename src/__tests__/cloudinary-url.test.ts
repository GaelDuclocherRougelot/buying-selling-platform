import { isCloudinaryUrl, productImagePublicId } from "@/lib/cloudinary-url";

describe("isCloudinaryUrl", () => {
	it("accepte une URL https Cloudinary", () => {
		expect(
			isCloudinaryUrl(
				"https://res.cloudinary.com/demo/image/upload/v1/messages/a.jpg"
			)
		).toBe(true);
	});

	it.each([
		"javascript:alert(document.domain)",
		"data:text/html,<script>alert(1)</script>",
		"http://res.cloudinary.com/demo/image/upload/a.jpg",
		"https://evil.com/a.jpg",
		"https://res.cloudinary.com@evil.com/a.jpg",
		"https://res.cloudinary.com.evil.com/a.jpg",
		"not a url",
		"",
		null,
		{ toString: () => "https://res.cloudinary.com/a.jpg" },
	])("refuse %p", (value) => {
		expect(isCloudinaryUrl(value)).toBe(false);
	});
});

describe("productImagePublicId", () => {
	const base = "https://res.cloudinary.com/zone/image/upload";
	beforeAll(() => {
		process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "zone";
	});

	it("accepte une image produit de notre cloud", () => {
		expect(productImagePublicId(`${base}/v12/product-pictures/abc.jpg`)).toBe(
			"product-pictures/abc"
		);
	});

	it.each([
		`${base}/v12/profile-pictures/user123.jpg`,
		`${base}/v12/proof-pictures/abc.jpg`,
		"https://res.cloudinary.com/autre/image/upload/v1/product-pictures/abc.jpg",
		"https://x.cloudinary.com/a/upload/product-pictures/abc.jpg",
		`${base}/v12/product-pictures/a%2F..%2Fprofile-pictures%2Fu.jpg`,
		`${base}/w_300/product-pictures/abc.jpg`,
		"https://images.unsplash.com/photo-1.jpg",
	])("refuse %s", (url) => {
		expect(productImagePublicId(url)).toBeNull();
	});
});
