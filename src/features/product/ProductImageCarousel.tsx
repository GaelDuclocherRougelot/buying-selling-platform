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
export default function ProductImageCarousel(props: { images: string[] }) {
	return (
		<Carousel
			opts={{
				align: "start",
			}}
			className="w-[670px] h-[500px] overflow-hidden"
		>
			<CarouselContent>
				{props.images.map((image) => (
					<CarouselItem key={image}>
						<Image
							src={image}
							alt="product"
							className="object-cover max-w-md"
							width={1920}
							height={1080}
						/>
					</CarouselItem>
				))}
			</CarouselContent>
			<CarouselPrevious />
			<CarouselNext />
		</Carousel>
	);
}
