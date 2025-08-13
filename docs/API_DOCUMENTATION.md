# Documentation de l'API - Plateforme d'Achat/Vente

Cette documentation décrit toutes les routes API disponibles dans la plateforme d'achat/vente.

## Base URL
```
https://votre-domaine.com/api
```

## Authentification
La plupart des routes nécessitent une authentification via un token Bearer JWT dans l'en-tête `Authorization`.

## Routes Disponibles

### 🛍️ Produits

#### `GET /api/products`
Récupère la liste des produits avec filtres et pagination.

**Paramètres de requête :**
- `categoryId` (optionnel) : ID de la catégorie
- `search` (optionnel) : Terme de recherche
- `minPrice` (optionnel) : Prix minimum
- `maxPrice` (optionnel) : Prix maximum
- `condition` (optionnel) : État du produit
- `limit` (optionnel) : Nombre de résultats (défaut: 20)
- `offset` (optionnel) : Pagination (défaut: 0)

#### `POST /api/products`
Crée un nouveau produit.

**Corps de la requête :**
```json
{
  "title": "Chaise design",
  "description": "Chaise en bois, très bon état",
  "price": 49.99,
  "condition": "GOOD",
  "imagesUrl": ["https://example.com/image1.jpg"],
  "categoryId": "cat_123",
  "ownerId": "user_123",
  "deliveryPrice": 5.99,
  "city": "Paris",
  "delivery": true
}
```

#### `GET /api/products/search`
Recherche avancée de produits.

**Paramètres de requête :**
- `q` (requis) : Terme de recherche
- `categoryId` (optionnel) : ID de la catégorie
- `minPrice` (optionnel) : Prix minimum
- `maxPrice` (optionnel) : Prix maximum
- `condition` (optionnel) : État du produit
- `limit` (optionnel) : Nombre de résultats (défaut: 20)
- `offset` (optionnel) : Pagination (défaut: 0)

#### `GET /api/products/featured`
Récupère les produits mis en avant pour la page d'accueil.

**Paramètres de requête :**
- `limit` (optionnel) : Nombre de produits (défaut: 10)

#### `GET /api/products/user/{userId}`
Récupère les produits d'un utilisateur spécifique.

**Paramètres de chemin :**
- `userId` : ID de l'utilisateur

**Paramètres de requête :**
- `status` (optionnel) : Statut des produits

#### `GET /api/products/{productId}`
Récupère les détails d'un produit spécifique.

**Paramètres de chemin :**
- `productId` : ID du produit

#### `PUT /api/products/{productId}`
Met à jour un produit existant.

**Paramètres de chemin :**
- `productId` : ID du produit

**Corps de la requête :** Même structure que POST, mais tous les champs sont optionnels.

### 👥 Utilisateurs

#### `GET /api/users/{userId}`
Récupère les informations publiques d'un utilisateur.

**Paramètres de chemin :**
- `userId` : ID de l'utilisateur

#### `PUT /api/users/{userId}`
Met à jour les informations d'un utilisateur.

**Paramètres de chemin :**
- `userId` : ID de l'utilisateur

**Corps de la requête :**
```json
{
  "displayUsername": "john_doe_new",
  "email": "john.new@example.com"
}
```

### 📦 Commandes

#### `GET /api/orders`
Récupère les commandes de l'utilisateur connecté.

**Paramètres de requête :**
- `type` (optionnel) : Type de commandes (`buyer`, `seller`, `all`)
- `stats` (optionnel) : Inclure les statistiques

**Authentification requise**

### 💬 Messages

#### `GET /api/messages/conversations`
Récupère les conversations de l'utilisateur connecté.

**Authentification requise**

#### `POST /api/messages/conversations`
Crée une nouvelle conversation.

**Corps de la requête :**
```json
{
  "productId": "product_123",
  "sellerId": "user_789",
  "initialMessage": "Bonjour, votre produit est-il toujours disponible ?"
}
```

**Authentification requise**

### ❤️ Favoris

#### `GET /api/favorites`
Récupère les favoris d'un utilisateur.

**Paramètres de requête :**
- `userId` (requis) : ID de l'utilisateur

#### `POST /api/favorites`
Ajoute un produit aux favoris.

**Corps de la requête :**
```json
{
  "userId": "user_123",
  "productId": "product_456"
}
```

### 🏷️ Catégories

#### `GET /api/categories`
Récupère toutes les catégories disponibles.

### 💳 Paiements

#### `POST /api/stripe/checkout/create-session`
Crée une session de paiement Stripe.

**Corps de la requête :**
```json
{
  "productId": "product_123",
  "amount": 59.99,
  "productTitle": "Chaise design"
}
```

**Authentification requise**

### 🔐 Authentification

#### `GET /api/auth/check-username`
Vérifie la disponibilité d'un nom d'utilisateur.

**Paramètres de requête :**
- `username` (requis) : Nom d'utilisateur à vérifier

### 📤 Upload

#### `POST /api/upload/{folder-name}`
Upload de fichiers dans un dossier spécifique.

**Paramètres de chemin :**
- `folder-name` : Nom du dossier de destination

**Corps de la requête :** `multipart/form-data` avec le champ `files`

## Codes de Statut HTTP

- `200` : Succès
- `400` : Requête invalide
- `401` : Non autorisé
- `404` : Ressource non trouvée
- `409` : Conflit (ex: conversation déjà existante)
- `500` : Erreur interne du serveur

## Schémas de Données

### Produit
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "price": "number",
  "condition": "string",
  "imagesUrl": ["string"],
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Utilisateur
```json
{
  "id": "string",
  "email": "string",
  "displayUsername": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "city": "string",
  "postalCode": "string",
  "country": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Commande
```json
{
  "id": "string",
  "productId": "string",
  "buyerId": "string",
  "sellerId": "string",
  "status": "string",
  "totalAmount": "number",
  "deliveryPrice": "number",
  "deliveryAddress": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

### Catégorie
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "icon": "string",
  "createdAt": "date-time",
  "updatedAt": "date-time"
}
```

## Notes Importantes

1. **Authentification** : La plupart des routes nécessitent un token JWT valide
2. **Pagination** : Utilisez `limit` et `offset` pour paginer les résultats
3. **Filtres** : Les filtres sont optionnels et peuvent être combinés
4. **Validation** : Tous les champs requis sont validés côté serveur
5. **Sécurité** : Les informations sensibles ne sont jamais exposées

## Support

Pour toute question concernant l'API, veuillez contacter l'équipe de développement.
