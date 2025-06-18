"use client";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

/**
 * ProductImageCarousel component displays a carousel of product images.
 * It uses the Carousel component from the UI library and includes navigation buttons.
 *
 * @param {Object} props - Component properties (not used in this case).
 * @param {string[]} props.images - Array of image URLs to display in the carousel.
 * @returns {JSX.Element} The ProductImageCarousel component.
 */
export default function ProductImageCarousel() {
	return (
		<Carousel
			opts={{
				align: "start",
			}}
			className="w-[670px] h-[500px]"
		>
			<CarouselContent>
				<CarouselItem>
					<Image
						src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
						alt="product"
						className="object-cover max-w-2xl"
						width={1920}
						height={1080}
					/>
				</CarouselItem>
				<CarouselItem>
					<Image
						src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
						alt="product"
						className="object-cover max-w-2xl"
						width={1920}
						height={1080}
					/>
				</CarouselItem>
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}
