# Guide de Maintenance de la Documentation Swagger

Ce guide explique comment maintenir et mettre à jour la documentation Swagger de l'API.

## Structure des Fichiers

```
src/lib/swagger/
├── swagger.ts          # Configuration principale de Swagger
├── tags.ts             # Définition des tags pour organiser l'API
└── schemas/            # Définitions des schémas de données
    ├── Product.ts
    ├── Products.ts
    ├── User.ts
    ├── Order.ts
    ├── Category.ts
    ├── Message.ts
    └── Payment.ts
```

## Comment Ajouter une Nouvelle Route API

### 1. Ajouter la Documentation Swagger

Utilisez les commentaires JSDoc avec la syntaxe `@swagger` au-dessus de chaque fonction de route :

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Description courte de la route
 *     description: Description détaillée de la route
 *     tags: [TagName]
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Description du paramètre
 *     responses:
 *       200:
 *         description: Succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SchemaName'
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur interne du serveur
 */
export async function GET(request: NextRequest) {
	// Implémentation de la route
}
```

### 2. Tags Disponibles

Utilisez l'un de ces tags pour organiser votre route :

- `[Products]` - Gestion des produits
- `[Users]` - Gestion des utilisateurs
- `[Orders]` - Gestion des commandes
- `[Messages]` - Système de messagerie
- `[Favorites]` - Gestion des favoris
- `[Categories]` - Gestion des catégories
- `[Payments]` - Système de paiement
- `[Authentication]` - Authentification
- `[Upload]` - Upload de fichiers
- `[Admin]` - Routes d'administration
- `[Shipping]` - Gestion de la livraison
- `[Platform]` - Fonctionnalités générales

### 3. Références aux Schémas

Pour référencer un schéma existant :

```typescript
schema: $ref: "#/components/schemas/Product";
```

Pour un tableau de schémas :

```typescript
schema: type: array;
items: $ref: "#/components/schemas/Product";
```

## Comment Ajouter un Nouveau Schéma

### 1. Créer le Fichier de Schéma

Créez un nouveau fichier dans `src/lib/swagger/schemas/` :

```typescript
// src/lib/swagger/schemas/NewEntity.ts
export const NewEntity = {
	type: "object",
	properties: {
		id: { type: "string", example: "entity_123" },
		name: { type: "string", example: "Nom de l'entité" },
		createdAt: {
			type: "string",
			format: "date-time",
			example: "2024-06-18T12:34:56.000Z",
		},
	},
};
```

### 2. Importer et Ajouter le Schéma

Ajoutez l'import dans `src/lib/swagger/swagger.ts` :

```typescript
import { NewEntity } from "./schemas/NewEntity";

// Dans la section schemas
schemas: {
  // ... autres schémas
  NewEntity: NewEntity,
}
```

## Bonnes Pratiques

### 1. Documentation des Paramètres

- **Paramètres de chemin** : Utilisez `in: path`
- **Paramètres de requête** : Utilisez `in: query`
- **Corps de la requête** : Utilisez `requestBody`

### 2. Codes de Statut HTTP

Documentez tous les codes de statut possibles :

- `200` : Succès
- `400` : Erreur de validation
- `401` : Non autorisé
- `404` : Ressource non trouvée
- `409` : Conflit
- `500` : Erreur interne

### 3. Exemples

Toujours inclure des exemples concrets dans les schémas et descriptions :

```typescript
properties: {
  price: {
    type: "number",
    example: 49.99,
    description: "Prix en euros"
  }
}
```

### 4. Authentification

Pour les routes protégées, ajoutez :

```typescript
security:
  - BearerAuth: []
```

## Validation de la Documentation

### 1. Vérifier la Syntaxe

La documentation Swagger est générée automatiquement à partir des commentaires JSDoc. Assurez-vous que :

- Tous les commentaires `@swagger` sont valides
- Les références aux schémas sont correctes
- La syntaxe OpenAPI 3.0 est respectée

### 2. Tester la Documentation

Accédez à `/api-doc` dans votre navigateur pour voir la documentation générée et vérifier que :

- Toutes les routes sont documentées
- Les schémas sont correctement affichés
- Les exemples fonctionnent
- La navigation est claire

## Dépannage

### Problèmes Courants

1. **Documentation non générée** : Vérifiez la syntaxe des commentaires JSDoc
2. **Schémas manquants** : Vérifiez les imports et références
3. **Erreurs de compilation** : Vérifiez la syntaxe TypeScript

### Outils Utiles

- **Swagger Editor** : Pour valider la syntaxe OpenAPI
- **Swagger UI** : Pour visualiser la documentation
- **Linter** : Pour détecter les erreurs de syntaxe

## Mise à Jour de la Documentation

### 1. Ajouter de Nouvelles Routes

Suivez le processus décrit ci-dessus pour chaque nouvelle route.

### 2. Modifier des Routes Existantes

Mettez à jour les commentaires JSDoc existants et vérifiez que la documentation est cohérente.

### 3. Ajouter de Nouveaux Schémas

Créez de nouveaux fichiers de schéma et mettez à jour les références.

## Ressources

- [Documentation OpenAPI 3.0](https://swagger.io/specification/)
- [Guide JSDoc](https://jsdoc.app/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Swagger Editor](https://swagger.io/tools/swagger-editor/)
