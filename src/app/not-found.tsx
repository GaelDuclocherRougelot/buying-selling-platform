import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-4">
					<div className="space-y-2">
						<h1 className="text-8xl font-bold text-muted-foreground/30 tracking-tight">
							404
						</h1>
						<h2 className="text-2xl font-semibold text-foreground">
							Page non trouvée
						</h2>
					</div>
					<p className="text-muted-foreground text-sm leading-relaxed">
						Désolé, la page que vous recherchez n&apos;existe pas ou
						a été déplacée.
					</p>
				</CardHeader>

				<CardContent className="space-y-3">
					<Button asChild className="w-full" size="lg">
						<Link href="/">Retour à l&apos;accueil</Link>
					</Button>
				</CardContent>

				<CardFooter className="flex justify-center border-t pt-6">
					<p className="text-xs text-muted-foreground text-center">
						Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,{" "}
						<Link
							href="/contact"
							className="text-primary hover:underline underline-offset-4 transition-colors"
						>
							contactez-nous
						</Link>
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
