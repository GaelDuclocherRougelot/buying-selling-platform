# Page de Recherche

Cette page permet aux utilisateurs de rechercher des annonces avec des filtres avancés.

## Fonctionnalités

### Recherche textuelle

- Recherche dans le titre et la description des annonces
- Recherche insensible à la casse
- Recherche en temps réel

### Filtres disponibles

#### Catégorie

- Filtrage par catégorie d'annonce
- Liste dynamique des catégories disponibles

#### État du produit

- Neuf
- Comme neuf
- Bon état
- État correct
- Mauvais état

#### Prix

- Prix minimum
- Prix maximum
- Recherche par fourchette de prix

#### Livraison

- Point de retrait
- Livraison
- Les deux options

#### Localisation

- Filtrage par ville
- Recherche insensible à la casse

#### Tri

- Plus récent (par défaut)
- Prix (croissant/décroissant)
- Titre (alphabétique)

## Structure des fichiers

```
src/app/search/
├── page.tsx                    # Page principale de recherche
├── metadata.ts                 # Métadonnées de la page
├── README.md                   # Documentation
└── _components/
    ├── SearchHeader.tsx        # En-tête avec barre de recherche
    ├── SearchFilters.tsx       # Panneau de filtres
    ├── SearchResults.tsx       # Affichage des résultats
    └── SearchProductCard.tsx   # Carte produit pour les résultats
```

## API

### Endpoint de recherche

`GET /api/products/search`

#### Paramètres de requête

- `q` : Recherche textuelle
- `category` : Nom de la catégorie
- `condition` : État du produit
- `minPrice` : Prix minimum
- `maxPrice` : Prix maximum
- `delivery` : Type de livraison
- `city` : Ville
- `sortBy` : Critère de tri (createdAt, price, title)
- `sortOrder` : Ordre de tri (asc, desc)
- `page` : Numéro de page
- `limit` : Nombre d'éléments par page (défaut: 12)

#### Réponse

```json
{
	"products": [
		{
			"id": "string",
			"title": "string",
			"description": "string",
			"price": "number",
			"condition": "string",
			"imagesUrl": ["string"],
			"delivery": "string",
			"deliveryPrice": "number",
			"city": "string",
			"createdAt": "string",
			"category": {
				"id": "string",
				"name": "string",
				"displayName": "string"
			},
			"owner": {
				"id": "string",
				"name": "string",
				"username": "string",
				"displayUsername": "string"
			}
		}
	],
	"pagination": {
		"currentPage": "number",
		"totalPages": "number",
		"totalCount": "number",
		"hasNextPage": "boolean",
		"hasPrevPage": "boolean"
	}
}
```

## Utilisation

1. Accéder à la page `/search`
2. Utiliser la barre de recherche principale pour une recherche textuelle
3. Utiliser les filtres dans le panneau de gauche pour affiner la recherche
4. Les résultats se mettent à jour automatiquement
5. Utiliser la pagination en bas de page pour naviguer

## URL avec paramètres

La page supporte les paramètres d'URL pour permettre le partage et la navigation :

```
/search?q=iphone&category=electronics&minPrice=100&maxPrice=500&condition=new&sortBy=price&sortOrder=asc&page=1
```

## Responsive

- Design responsive avec grille adaptative
- Filtres collants sur desktop
- Navigation mobile optimisée
- Cartes produits adaptées aux différentes tailles d'écran
