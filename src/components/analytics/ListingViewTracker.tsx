"use client";

import { trackListingViewed } from "@/lib/analytics";
import { useEffect } from "react";

interface ListingViewTrackerProps {
	listingId: string;
	category: string;
	price: number;
}

/** Envoie listing_viewed une fois par affichage d'annonce. */
export default function ListingViewTracker({
	listingId,
	category,
	price,
}: ListingViewTrackerProps) {
	useEffect(() => {
		trackListingViewed({ listingId, category, price });
	}, [listingId, category, price]);

	return null;
}
