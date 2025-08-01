"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";

interface CookiePreferences {
	essential: boolean;
	analytics: boolean;
	marketing: boolean;
}

export default function CookieBanner() {
	const [showBanner, setShowBanner] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [preferences, setPreferences] = useState<CookiePreferences>({
		essential: true, // Toujours activé
		analytics: false,
		marketing: false,
	});

	useEffect(() => {
		// Vérifier si le consentement a déjà été donné
		const consent = localStorage.getItem("cookie-consent");
		if (!consent) {
			setShowBanner(true);
		}
	}, []);

	const handleAcceptAll = () => {
		const allPreferences = {
			essential: true,
			analytics: true,
			marketing: true,
		};
		setPreferences(allPreferences);
		saveConsent(allPreferences);
		setShowBanner(false);
	};

	const handleAcceptEssential = () => {
		const essentialPreferences = {
			essential: true,
			analytics: false,
			marketing: false,
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
		localStorage.setItem("cookie-consent", JSON.stringify(prefs));
		localStorage.setItem("cookie-consent-date", new Date().toISOString());

		// Appliquer les préférences
		if (prefs.analytics) {
			// Activer Google Analytics
			console.log("Analytics activé");
		}
		if (prefs.marketing) {
			// Activer les cookies marketing
			console.log("Marketing activé");
		}
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
								>
									<X size={16} />
								</Button>
							</div>

							<p className="text-sm text-gray-600">
								Nous utilisons des cookies pour améliorer votre
								expérience, analyser le trafic et personnaliser
								le contenu. En cliquant sur &quot;Accepter
								tout&quot;, vous consentez à l&apos;utilisation
								de tous les cookies. Vous pouvez également
								choisir les types de cookies que vous acceptez.
							</p>

							<div className="flex flex-wrap gap-2">
								<Button
									onClick={handleAcceptEssential}
									variant="outline"
								>
									Cookies essentiels uniquement
								</Button>
								<Button onClick={handleAcceptAll}>
									Accepter tout
								</Button>
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

								<div className="flex items-center justify-between p-3 border rounded-lg">
									<div>
										<h4 className="font-medium">
											Cookies marketing
										</h4>
										<p className="text-sm text-gray-600">
											Utilisés pour vous proposer des
											contenus personnalisés
										</p>
									</div>
									<input
										type="checkbox"
										checked={preferences.marketing}
										onChange={() =>
											handlePreferenceChange("marketing")
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
