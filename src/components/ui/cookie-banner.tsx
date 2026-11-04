"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	type CookiePreferences,
	OPEN_COOKIE_BANNER_EVENT,
	readConsent,
	syncConsentCookie,
	writeConsent,
} from "@/lib/consent";
import { Cookie, Settings, X } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

export default function CookieBanner() {
	const [showBanner, setShowBanner] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [preferences, setPreferences] = useState<CookiePreferences>({
		essential: true, // Toujours activé
		analytics: false,
	});

	useEffect(() => {
		// Vérifier si le consentement a déjà été donné (et n'a pas expiré)
		const consent = readConsent();
		syncConsentCookie();
		if (!consent) {
			setShowBanner(true);
		} else {
			setPreferences(consent);
		}

		// Lien "Gérer les cookies" du footer
		const open = () => {
			const current = readConsent();
			if (current) setPreferences(current);
			setShowSettings(false);
			setShowBanner(true);
		};
		window.addEventListener(OPEN_COOKIE_BANNER_EVENT, open);
		return () => window.removeEventListener(OPEN_COOKIE_BANNER_EVENT, open);
	}, []);

	const handleAcceptAll = () => {
		const allPreferences = {
			essential: true,
			analytics: true,
		};
		setPreferences(allPreferences);
		saveConsent(allPreferences);
		setShowBanner(false);
	};

	const handleAcceptEssential = () => {
		const essentialPreferences = {
			essential: true,
			analytics: false,
		};
		setPreferences(essentialPreferences);
		saveConsent(essentialPreferences);
		setShowBanner(false);
	};

	const handleSavePreferences = () => {
		saveConsent(preferences);
		setShowBanner(false);
		setShowSettings(false);
	};

	const saveConsent = (prefs: CookiePreferences) => {
		// Appliquer les préférences analytics (PostHog)
		if (posthog.__loaded) {
			if (prefs.analytics) posthog.opt_in_capturing();
			else posthog.opt_out_capturing();
		}
		writeConsent(prefs);
	};

	const handlePreferenceChange = (key: keyof CookiePreferences) => {
		if (key === "essential") return; // Ne peut pas être désactivé

		setPreferences((prev) => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	if (!showBanner) return null;

	return (
		<div className="fixed z-50 top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-black/50 w-full h-screen flex items-center justify-center">
			<Card className="max-w-2xl mx-auto">
				<CardContent className="p-6">
					{!showSettings ? (
						<div className="space-y-4">
							<div className="flex items-start justify-between">
								<div className="flex items-center space-x-2">
									<Cookie className="h-5 w-5 text-blue-600" />
									<h3 className="text-lg font-semibold">
										Respect de votre vie privée
									</h3>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowBanner(false)}
									className="text-gray-500 hover:text-gray-700"
									aria-label="Fermer"
								>
									<X size={16} />
								</Button>
							</div>

							<p className="text-sm text-gray-600">
								Nous utilisons des cookies pour améliorer votre
								expérience, analyser le trafic et personnaliser
								le contenu. Vous pouvez accepter ou refuser
								les cookies non essentiels, et modifier votre
								choix à tout moment via le lien &quot;Gérer
								les cookies&quot; en bas de page.
							</p>

							{/* CNIL : "Refuser" aussi simple et visible que "Accepter" */}
							<div className="grid grid-cols-2 gap-2">
								<Button
									onClick={handleAcceptEssential}
									className="w-full"
								>
									Refuser
								</Button>
								<Button
									onClick={handleAcceptAll}
									className="w-full"
								>
									Accepter
								</Button>
							</div>
							<div className="flex justify-center">
								<Button
									onClick={() => setShowSettings(true)}
									variant="ghost"
									className="flex items-center space-x-1"
								>
									<Settings size={14} />
									<span>Personnaliser</span>
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h3 className="text-lg font-semibold">
									Préférences de cookies
								</h3>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowSettings(false)}
									aria-label="Fermer"
								>
									<X size={16} />
								</Button>
							</div>

							<div className="space-y-4">
								<div className="flex items-center justify-between p-3 border rounded-lg">
									<div>
										<h4 className="font-medium">
											Cookies essentiels
										</h4>
										<p className="text-sm text-gray-600">
											Indispensables au fonctionnement du
											site
										</p>
									</div>
									<input
										type="checkbox"
										checked={preferences.essential}
										disabled
										className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
									/>
								</div>

								<div className="flex items-center justify-between p-3 border rounded-lg">
									<div>
										<h4 className="font-medium">
											Cookies d&apos;analyse
										</h4>
										<p className="text-sm text-gray-600">
											Nous aident à comprendre comment
											vous utilisez le site
										</p>
									</div>
									<input
										type="checkbox"
										checked={preferences.analytics}
										onChange={() =>
											handlePreferenceChange("analytics")
										}
										className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
									/>
								</div>
							</div>

							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setShowSettings(false)}
								>
									Annuler
								</Button>
								<Button onClick={handleSavePreferences}>
									Sauvegarder les préférences
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
