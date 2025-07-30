# Page des Catégories

Cette page permet d'afficher toutes les catégories disponibles sur la plateforme.

## Structure

### Page principale : `/categories`

- **Fichier** : `src/app/categories/page.tsx`
- **Fonctionnalité** : Affiche toutes les catégories dans une grille responsive
- **Composant utilisé** : `CategoryCard` de `@/features/category/CategoryCard`

### Page de catégorie spécifique : `/categories/[categoryName]`

- **Fichier** : `src/app/categories/[categoryName]/page.tsx`
- **Fonctionnalité** : Affiche tous les produits d'une catégorie spécifique
- **Composant utilisé** : `ProductCard` de `@/features/product/ProductCard`

## Fonctionnalités

### Page principale (`/categories`)

- ✅ **Grille responsive** : 1 colonne sur mobile, jusqu'à 5 colonnes sur desktop
- ✅ **Chargement avec spinner** : Indicateur de chargement pendant le fetch des données
- ✅ **Gestion d'erreur** : Messages d'erreur avec toast
- ✅ **État vide** : Message si aucune catégorie trouvée
- ✅ **Navigation** : Chaque carte redirige vers la page de catégorie

### Page de catégorie (`/categories/[categoryName]`)

- ✅ **Filtrage par catégorie** : API mise à jour pour supporter le paramètre `category`
- ✅ **Navigation retour** : Lien pour revenir à la page des catégories
- ✅ **Compteur de produits** : Affichage du nombre de produits trouvés
- ✅ **Formatage du nom** : Conversion des slugs en noms lisibles
- ✅ **Grille responsive** : Affichage des produits en grille

## API

### Endpoint : `/api/products`

- **Méthode** : `GET`
- **Paramètres** :
    - `category` (optionnel) : Nom de la catégorie pour filtrer les produits
- **Réponse** : Liste des produits avec ou sans filtrage

### Endpoint : `/api/categories`

- **Méthode** : `GET`
- **Réponse** : Liste de toutes les catégories

## Composants utilisés

### CategoryCard

```tsx
<CategoryCard
	id={category.id}
	name={category.name}
	displayName={category.displayName}
	createdAt={category.createdAt}
	updatedAt={category.updatedAt}
/>
```

### ProductCard

```tsx
<ProductCard
	title={product.title}
	description={product.description}
	price={product.price}
	imageUrl={product.imagesUrl[0]}
	category={product.categoryId}
	productId={product.id}
/>
```

## Navigation

### Depuis la page d'accueil

- Le `CategoriesNavbar` contient un lien vers `/categories`
- Les cartes de catégories sur la page d'accueil redirigent vers `/categories/[categoryName]`

### Depuis la page des catégories

- Chaque `CategoryCard` est cliquable et redirige vers `/categories/[categoryName]`
- Effet de hover avec ombre pour indiquer l'interactivité

## URLs de test

Basé sur les données actuelles :

- **Page principale** : `/categories`
- **Catégorie Voitures** : `/categories/cars`

## Améliorations futures

- [ ] **Images de catégories** : Ajouter des images spécifiques pour chaque catégorie
- [ ] **Recherche** : Ajouter une barre de recherche pour filtrer les catégories
- [ ] **Tri** : Permettre de trier les catégories par popularité, nom, etc.
- [ ] **Pagination** : Pour les catégories avec beaucoup de produits
- [ ] **SEO** : Ajouter des métadonnées dynamiques pour chaque catégorie
