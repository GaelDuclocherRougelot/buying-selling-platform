import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
	return (
		<footer className="py-4 bg-muted text-center text-sm border-t border-border w-full h-16">
			<nav className="flex justify-center gap-6">
				<Link
					href="/legal/cgv"
					className="text-foreground hover:underline"
				>
					Condition générales de vente
				</Link>
				<Link
					href="/legal/cgu"
					className="text-foreground hover:underline"
				>
					Condition générales d&apos;utilisation
				</Link>
				<Link
					href="/legal/politique-de-confidentialite"
					className="text-foreground hover:underline"
				>
					Politique de confidentialité
				</Link>
				<Link
					href="/legal/mentions-legales"
					className="text-foreground hover:underline"
				>Mentions légales</Link>
			</nav>
		</footer>
	);
};

export default Footer;
