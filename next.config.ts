import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// Optimize build output
	output: "standalone",

	// Configuration CORS globale (alternative au middleware)
	async headers() {
		return [
			{
				// Appliquer à toutes les routes API
				source: "/api/:path*",
				headers: [
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{
						key: "Access-Control-Allow-Methods",
						value: "GET, POST, PUT, DELETE, OPTIONS, PATCH",
					},
					{
						key: "Access-Control-Allow-Headers",
						value: "Content-Type, Authorization, X-Requested-With, Accept",
					},
					{ key: "Access-Control-Max-Age", value: "86400" },
					{ key: "Access-Control-Allow-Credentials", value: "true" },
				],
			},
		];
	},

	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
			},
		],
	},
	env: {
		NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
			process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
		NEXT_PUBLIC_CLOUDINARY_PRESET_NAME:
			process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME,
	},
};

export default nextConfig;
