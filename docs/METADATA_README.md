# Métadonnées de la Plateforme d'Achat et de Vente

Ce document décrit l'implémentation des métadonnées pour la plateforme d'achat et de vente, optimisées pour le SEO et le partage sur les réseaux sociaux.

## Structure des Métadonnées

### 1. Configuration de Base (`src/app/layout.tsx`)

La configuration de base inclut :

- **Titre par défaut** : "Plateforme d'Achat et de Vente - Trouvez et Vendez Facilement"
- **Template de titre** : "%s | Plateforme d'Achat et de Vente"
- **Description** : Description complète de la plateforme
- **Mots-clés** : Mots-clés pertinents pour le SEO
- **Open Graph** : Optimisation pour Facebook, LinkedIn, etc.
- **Twitter Cards** : Optimisation pour Twitter
- **Robots** : Configuration pour les moteurs de recherche
- **Locale** : Configuration pour le français (fr_FR)

### 2. Pages avec Métadonnées Implémentées

#### Pages d'Authentification

- **Connexion** (`/auth/login`) : Métadonnées pour la page de connexion
- **Inscription** (`/auth/register`) : Métadonnées pour la création de compte
- **Profil** (`/auth/profile`) : Métadonnées pour la gestion du profil
- **Mot de passe oublié** (`/auth/forget-password`) : Métadonnées pour la réinitialisation

#### Pages Légales

- **Conditions Générales d'Utilisation** (`/legal/cgu`) : Métadonnées pour les CGU
- **Conditions Générales de Vente** (`/legal/cgv`) : Métadonnées pour les CGV
- **Politique de Confidentialité** (`/legal/politique-de-confidentialite`) : Métadonnées RGPD
- **Mentions Légales** (`/legal/mentions-legales`) : Métadonnées légales

#### Pages Produits

- **Détail Produit** (`/products/[category]/[productId]`) : Métadonnées dynamiques basées sur les données du produit

### 3. Métadonnées Dynamiques

#### Page Produit

La page produit utilise `generateMetadata` pour créer des métadonnées dynamiques :

- **Titre** : Nom du produit
- **Description** : Description du produit avec prix
- **Images** : Première image du produit
- **URL** : URL canonique du produit
- **Gestion d'erreur** : Métadonnées de fallback en cas d'erreur

### 4. Configuration Centralisée (`src/lib/metadata.ts`)

Fichier de configuration centralisée contenant :

- **baseMetadata** : Configuration de base réutilisable
- **pageMetadata** : Métadonnées spécifiques par page
- **generatePageMetadata** : Fonction helper pour générer des métadonnées

## Optimisations SEO

### 1. Mots-clés Français

- Utilisation de mots-clés pertinents en français
- Optimisation pour les recherches locales
- Mots-clés spécifiques au e-commerce

### 2. Open Graph

- Images optimisées (1200x630px)
- Descriptions engageantes
- Titres optimisés pour le partage

### 3. Twitter Cards

- Configuration pour les cartes Twitter
- Images et descriptions optimisées
- Support du partage sur Twitter

### 4. Robots

- Configuration pour l'indexation Google
- Paramètres pour les aperçus de recherche
- Optimisation pour les snippets

## Utilisation

### Pour les Pages Statiques

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Titre de la Page",
	description: "Description de la page",
	// ... autres métadonnées
};
```

### Pour les Pages Dynamiques

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
	// Récupération des données
	const data = await fetchData(params);

	return {
		title: data.title,
		description: data.description,
		// ... autres métadonnées dynamiques
	};
}
```

### Utilisation de la Configuration Centralisée

```typescript
import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata("login");
```

## Bonnes Pratiques

1. **Titres uniques** : Chaque page a un titre unique et descriptif
2. **Descriptions engageantes** : Descriptions qui incitent au clic
3. **Mots-clés pertinents** : Mots-clés spécifiques au contenu
4. **Images optimisées** : Images de bonne qualité pour les réseaux sociaux
5. **URLs canoniques** : URLs propres et descriptives
6. **Gestion d'erreur** : Métadonnées de fallback en cas d'erreur

## Maintenance

- Mettre à jour les métadonnées lors de l'ajout de nouvelles pages
- Vérifier régulièrement les performances SEO
- Optimiser les descriptions selon les tendances de recherche
- Maintenir la cohérence des métadonnées sur l'ensemble du site
