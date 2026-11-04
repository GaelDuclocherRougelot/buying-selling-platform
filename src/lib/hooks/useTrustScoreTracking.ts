"use client";

import {
	trackTrustScoreBadgeHovered,
	trackTrustScoreOpened,
} from "@/lib/analytics";
import { useCallback, useRef } from "react";

/**
 * Tracking du Trust Score vendeur.
 * - onBadgeHover : à brancher sur onMouseEnter/onFocus du badge (1 envoi par montage)
 * - onOpen : à appeler quand le détail du Trust Score est ouvert
 */
export function useTrustScoreTracking(sellerId: string, score: number) {
	const hovered = useRef(false);

	const onBadgeHover = useCallback(() => {
		if (hovered.current) return;
		hovered.current = true;
		trackTrustScoreBadgeHovered({ sellerId });
	}, [sellerId]);

	const onOpen = useCallback(() => {
		trackTrustScoreOpened({ sellerId, score });
	}, [sellerId, score]);

	return { onBadgeHover, onOpen };
}
