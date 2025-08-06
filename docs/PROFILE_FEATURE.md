# Fonctionnalité de Profil Public

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs de voir le profil public d'un vendeur et de découvrir tous les produits qu'il propose sur la plateforme.

## Fonctionnalités

### Page de Profil Public (`/profile/[userId]`)

- **Affichage des informations du vendeur** :

    - Nom d'utilisateur et nom complet
    - Avatar (avec fallback sur les initiales)
    - Date d'inscription
    - Nombre de produits actifs

- **Liste des produits** :
    - Affichage de tous les produits actifs du vendeur
    - Utilisation du composant `ProductCardWithSeller` pour une UI cohérente
    - Filtrage automatique des produits vendus (non affichés)

### Composants créés

#### `ProductCardWithSeller`

Extension du `ProductCard` standard qui inclut :

- Toutes les fonctionnalités du `ProductCard` original
- Lien vers le profil du vendeur
- Informations du vendeur (nom d'utilisateur/nom)

#### `SellerLink`

Composant réutilisable pour afficher un lien vers le profil d'un vendeur :

- Icône utilisateur
- Nom d'utilisateur ou nom complet
- Lien vers `/profile/[userId]`

### API Endpoints

#### `GET /api/users/[userId]`

Récupère les informations publiques d'un utilisateur :

- ID, nom, nom d'utilisateur
- Avatar et date de création
- Exclut les informations sensibles (email, etc.)
- Exclut les utilisateurs supprimés

#### `GET /api/products/user/[userId]` (existant)

Récupère tous les produits d'un utilisateur spécifique.

## Intégration

### Liens vers le profil

Les liens vers le profil public ont été ajoutés dans :

- Page de détail d'un produit (`/products/[category]/[productId]`)
- Page des favoris (`/auth/favorites`)

### Navigation

Les utilisateurs peuvent maintenant :

1. Cliquer sur le nom du vendeur dans une annonce
2. Voir tous les produits de ce vendeur
3. Naviguer facilement entre les profils

## Sécurité

- Seules les informations publiques sont exposées
- Les utilisateurs supprimés ne sont pas accessibles
- Les produits vendus ne sont pas affichés dans le profil public
- Pas d'accès aux informations sensibles (email, etc.)

## Utilisation

### Accès direct

```
/profile/[userId]
```

### Depuis une annonce

Cliquer sur le nom du vendeur dans la page de détail d'un produit.

### Depuis les favoris

Cliquer sur le nom du vendeur dans la liste des favoris.

## Interface utilisateur

- Design cohérent avec le reste de l'application
- Responsive design (mobile, tablette, desktop)
- États de chargement et d'erreur
- Messages informatifs quand aucun produit n'est disponible
