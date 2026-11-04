/**
 * Gestion du consentement cookies (CNIL).
 * Le choix est stocké dans localStorage sous la clé `cookie-consent`
 * (format compatible avec le bandeau existant).
 */

export interface CookiePreferences {
	essential: boolean;
	analytics: boolean;
	marketing: boolean;
}

export const CONSENT_STORAGE_KEY = "cookie-consent";
export const CONSENT_DATE_STORAGE_KEY = "cookie-consent-date";
/** Événement DOM pour rouvrir le bandeau (lien "Gérer les cookies"). */
export const OPEN_COOKIE_BANNER_EVENT = "zone:open-cookie-banner";
/** Événement DOM émis quand le consentement change. */
export const CONSENT_CHANGED_EVENT = "zone:consent-changed";

/** La CNIL recommande de redemander le consentement après 13 mois max. */
const CONSENT_MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000;

export function readConsent(): CookiePreferences | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
		if (!raw) return null;
		const date = window.localStorage.getItem(CONSENT_DATE_STORAGE_KEY);
		if (date && Date.now() - new Date(date).getTime() > CONSENT_MAX_AGE_MS) {
			return null;
		}
		const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
		return {
			essential: true,
			analytics: parsed.analytics === true,
			marketing: parsed.marketing === true,
		};
	} catch {
		return null;
	}
}

export function writeConsent(prefs: CookiePreferences): void {
	try {
		window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
		window.localStorage.setItem(
			CONSENT_DATE_STORAGE_KEY,
			new Date().toISOString()
		);
	} catch {
		// stockage indisponible (navigation privée…) : on ignore
	}
	window.dispatchEvent(
		new CustomEvent<CookiePreferences>(CONSENT_CHANGED_EVENT, {
			detail: prefs,
		})
	);
}

export function hasAnalyticsConsent(): boolean {
	return readConsent()?.analytics === true;
}

export function openCookieBanner(): void {
	window.dispatchEvent(new Event(OPEN_COOKIE_BANNER_EVENT));
}
