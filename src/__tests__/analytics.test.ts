jest.mock("posthog-js", () => ({
	__esModule: true,
	default: {
		__loaded: true,
		capture: jest.fn(),
		identify: jest.fn(),
		reset: jest.fn(),
		opt_in_capturing: jest.fn(),
		opt_out_capturing: jest.fn(),
		get_distinct_id: jest.fn(() => "anon"),
	},
}));

import posthog from "posthog-js";
import {
	identifyUser,
	resetAnalytics,
	trackCheckoutStarted,
	trackListingViewed,
} from "@/lib/analytics";
import {
	hasAnalyticsConsent,
	isAnalyticsConsentCookie,
	readConsent,
	writeConsent,
} from "@/lib/consent";

const ph = posthog as jest.Mocked<typeof posthog>;

describe("analytics", () => {
	beforeEach(() => jest.clearAllMocks());

	it("capture les événements typés", () => {
		trackListingViewed({ listingId: "p1", category: "meubles", price: 20 });
		trackCheckoutStarted({ listingId: "p1", price: 20 });
		expect(ph.capture).toHaveBeenCalledWith("listing_viewed", {
			listingId: "p1",
			category: "meubles",
			price: 20,
		});
		expect(ph.capture).toHaveBeenCalledWith("checkout_started", {
			listingId: "p1",
			price: 20,
		});
	});

	it("identify avec l'id uniquement", () => {
		identifyUser("user_1");
		expect(ph.identify).toHaveBeenCalledWith("user_1");
	});

	it("reset puis ré-applique le consentement", () => {
		resetAnalytics(true);
		expect(ph.reset).toHaveBeenCalled();
		expect(ph.opt_in_capturing).toHaveBeenCalled();
		resetAnalytics(false);
		expect(ph.opt_out_capturing).toHaveBeenCalled();
	});
});

describe("consent", () => {
	beforeEach(() => localStorage.clear());

	it("aucun consentement par défaut", () => {
		expect(readConsent()).toBeNull();
		expect(hasAnalyticsConsent()).toBe(false);
	});

	it("mémorise le choix", () => {
		writeConsent({ essential: true, analytics: true });
		expect(hasAnalyticsConsent()).toBe(true);
	});

	it("expire après 13 mois", () => {
		writeConsent({ essential: true, analytics: true });
		localStorage.setItem("cookie-consent-date", "2000-01-01T00:00:00.000Z");
		expect(readConsent()).toBeNull();
	});
});

describe("consent cookie", () => {
	beforeEach(() => {
		localStorage.clear();
		document.cookie = "zone_analytics_consent=; Path=/; Max-Age=0";
	});

	it("pose le cookie serveur selon le choix", () => {
		writeConsent({ essential: true, analytics: true });
		expect(document.cookie).toContain("zone_analytics_consent=1");
		writeConsent({ essential: true, analytics: false });
		expect(document.cookie).toContain("zone_analytics_consent=0");
	});

	it("isAnalyticsConsentCookie n'accepte que '1'", () => {
		expect(isAnalyticsConsentCookie("1")).toBe(true);
		expect(isAnalyticsConsentCookie("0")).toBe(false);
		expect(isAnalyticsConsentCookie(undefined)).toBe(false);
	});
});
