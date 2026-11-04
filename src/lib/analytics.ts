"use client";

import posthog from "posthog-js";

/**
 * Événements analytics typés (PostHog).
 * Une fonction par événement : ne jamais envoyer de donnée personnelle
 * (email, nom, adresse, contenu de message…).
 * Tant que l'utilisateur n'a pas consenti, posthog-js est en opt-out
 * et ces appels ne sont pas envoyés.
 */

export interface AnalyticsEvents {
	signup_completed: Record<string, never>;
	listing_viewed: { listingId: string; category: string; price: number };
	listing_published: { category: string };
	favorite_added: { listingId: string };
	trust_score_opened: { sellerId: string; score: number };
	trust_score_badge_hovered: { sellerId: string };
	checkout_started: { listingId: string; price: number };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

function capture<E extends AnalyticsEventName>(
	event: E,
	properties: AnalyticsEvents[E]
): void {
	if (typeof window === "undefined" || !posthog.__loaded) return;
	posthog.capture(event, properties);
}

export const trackSignupCompleted = () => capture("signup_completed", {});

export const trackListingViewed = (p: AnalyticsEvents["listing_viewed"]) =>
	capture("listing_viewed", p);

export const trackListingPublished = (
	p: AnalyticsEvents["listing_published"]
) => capture("listing_published", p);

export const trackFavoriteAdded = (p: AnalyticsEvents["favorite_added"]) =>
	capture("favorite_added", p);

export const trackTrustScoreOpened = (
	p: AnalyticsEvents["trust_score_opened"]
) => capture("trust_score_opened", p);

export const trackTrustScoreBadgeHovered = (
	p: AnalyticsEvents["trust_score_badge_hovered"]
) => capture("trust_score_badge_hovered", p);

export const trackCheckoutStarted = (p: AnalyticsEvents["checkout_started"]) =>
	capture("checkout_started", p);

/** Identifie l'utilisateur par son id uniquement (jamais email/nom). */
export function identifyUser(userId: string): void {
	if (typeof window === "undefined" || !posthog.__loaded) return;
	if (posthog.get_distinct_id() !== userId) posthog.identify(userId);
}

/**
 * Réinitialise l'identité à la déconnexion.
 * reset() efface aussi l'état de consentement de posthog-js : on ré-applique
 * le choix de l'utilisateur juste après (reset avant opt-in, jamais après).
 */
export function resetAnalytics(analyticsConsent: boolean): void {
	if (typeof window === "undefined" || !posthog.__loaded) return;
	posthog.reset();
	if (analyticsConsent) posthog.opt_in_capturing();
	else posthog.opt_out_capturing();
}
