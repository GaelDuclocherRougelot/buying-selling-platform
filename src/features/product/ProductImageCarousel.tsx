"use client";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

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
