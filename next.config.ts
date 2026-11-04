import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	// Optimize build output
	output: "standalone",
	// Requis par le reverse proxy PostHog (/ingest)
	skipTrailingSlashRedirect: true,

	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/array/:path*",
				destination: "https://eu-assets.i.posthog.com/array/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://eu.i.posthog.com/:path*",
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
