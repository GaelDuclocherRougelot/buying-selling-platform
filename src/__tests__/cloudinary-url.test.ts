import { isCloudinaryUrl } from "@/lib/cloudinary-url";

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
