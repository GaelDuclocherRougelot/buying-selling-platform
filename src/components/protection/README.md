# Composants de Protection Stripe

Ce dossier contient les composants et hooks pour protéger les pages qui nécessitent un compte vendeur Stripe actif.

## Composants

### StripeSellerGuard

Un composant de protection qui vérifie automatiquement le statut Stripe de l'utilisateur et affiche un indicateur de chargement pendant la vérification.

```tsx
import { StripeSellerGuard } from "@/components/protection/StripeSellerGuard";

const MyProtectedPage = () => {
	return (
		<StripeSellerGuard>
			{/* Contenu protégé - ne s'affiche que si l'utilisateur a un compte vendeur actif */}
			<div>Contenu de la page</div>
		</StripeSellerGuard>
	);
};
```

### Props

- `children`: Le contenu à afficher si l'utilisateur a un compte vendeur actif
- `fallback` (optionnel): Un composant personnalisé à afficher pendant la vérification

## Hooks

### useStripeSellerCheck

Un hook personnalisé qui vérifie le statut Stripe de l'utilisateur et gère les redirections automatiques.

```tsx
import { useStripeSellerCheck } from "@/lib/hooks/useStripeSellerCheck";

const MyComponent = () => {
	const { isChecking, stripeStatus, canAccess } = useStripeSellerCheck();

	if (isChecking) {
		return <div>Vérification en cours...</div>;
	}

	if (!canAccess) {
		return <div>Accès refusé</div>;
	}

	return <div>Contenu autorisé</div>;
};
```

### Retour du hook

- `isChecking`: Boolean indiquant si la vérification est en cours
- `stripeStatus`: Objet contenant le statut Stripe de l'utilisateur
- `canAccess`: Boolean indiquant si l'utilisateur peut accéder au contenu

## Comportement

1. **Pas de compte Stripe**: L'utilisateur est redirigé vers `/auth/profile` avec un message d'erreur
2. **Compte en attente**: L'utilisateur est redirigé vers `/auth/profile` avec un message d'erreur
3. **Compte actif**: L'utilisateur peut accéder au contenu protégé

## Utilisation

Pour protéger une page, utilisez simplement le composant `StripeSellerGuard` :

```tsx
// pages/auth/publish/page.tsx
export default function PublishPage() {
	return (
		<StripeSellerGuard>
			<div>Formulaire de publication</div>
		</StripeSellerGuard>
	);
}
```
