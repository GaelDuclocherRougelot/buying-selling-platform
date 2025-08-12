# Guide de Dépannage - Système de Messagerie

## Erreurs Courantes et Solutions

### 1. Erreur Next.js 15 : `params` doit être attendu

**Erreur :**

```
Error: Route "/api/messages/conversations/[conversationId]/read" used `params.conversationId`.
`params` should be awaited before using its properties.
```

**Cause :** Next.js 15 exige que les paramètres dynamiques soient attendus avec `await`

**Solution :** Modifier les endpoints API comme suit :

```typescript
// ❌ AVANT (Next.js 14)
export async function POST(
	request: NextRequest,
	{ params }: { params: { conversationId: string } }
) {
	const { conversationId } = params; // Erreur !
}

// ✅ APRÈS (Next.js 15)
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	const { conversationId } = await params; // Correct !
}
```

**Endpoints corrigés :**

- ✅ `/api/messages/conversations/[conversationId]/read`
- ✅ `/api/messages/conversations/[conversationId]/messages`

### 2. Erreur : `Cannot read properties of undefined (reading 'image')`

**Erreur :**

```
TypeError: Cannot read properties of undefined (reading 'image')
```

**Cause :** Les données de conversation sont incomplètes ou `undefined`

**Solutions appliquées :**

#### A. Fonction `getOtherUser()` sécurisée

```typescript
const getOtherUser = () => {
	if (currentUserId === conversation.buyerId) {
		return (
			conversation.seller || {
				name: "Vendeur",
				image: null,
				username: null,
			}
		);
	}
	return (
		conversation.buyer || {
			name: "Acheteur",
			image: null,
			username: null,
		}
	);
};
```

#### B. Vérification de sécurité dans le rendu

```typescript
if (!conversation || !conversation.buyer || !conversation.seller) {
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
                <p>Erreur : Données de conversation invalides</p>
                <p className="text-sm">Veuillez rafraîchir la page</p>
            </div>
        </div>
    );
}
```

#### C. Propriétés optionnelles sécurisées

```typescript
{
	conversation.product?.title || "Produit non disponible";
}
{
	conversation.product?.price
		? `${conversation.product.price.toFixed(2)} €`
		: "Prix non disponible";
}
```

### 3. Erreur : Conversation non trouvée

**Cause :** Les données de conversation ne sont pas correctement récupérées

**Solution :** Amélioration de `fetchConversationMessagesLocal`

```typescript
const fetchConversationMessagesLocal = async (conversationId: string) => {
	try {
		// Récupérer la conversation complète depuis la liste
		const conversation = conversations.find(
			(conv) => conv.id === conversationId
		);
		if (!conversation) {
			throw new Error("Conversation non trouvée");
		}

		// Récupérer les messages
		const messages = await fetchConversationMessages(conversationId);

		// Retourner la conversation complète avec les messages
		return {
			...conversation,
			messages: messages || [],
		};
	} catch (error) {
		console.error("Erreur lors du chargement des messages:", error);
	}
	return null;
};
```

## Tests et Vérifications

### 1. Test des API

Exécuter le script de test :

```bash
node test-messaging-api.js
```

### 2. Vérification des logs

Dans la console du navigateur, vérifier :

- ✅ Pas d'erreurs JavaScript
- ✅ Messages de debug de la messagerie
- ✅ État des conversations et messages

### 3. Vérification des données

Dans l'onglet Network des DevTools :

- ✅ Requêtes API réussies (200)
- ✅ Réponses JSON valides
- ✅ Données de conversation complètes

## Prévention des Erreurs

### 1. Validation des données

Toujours vérifier l'existence des propriétés avant utilisation :

```typescript
// ❌ Risqué
const userName = conversation.buyer.name;

// ✅ Sécurisé
const userName = conversation.buyer?.name || "Utilisateur inconnu";
```

### 2. Gestion des états de chargement

Afficher des indicateurs de chargement :

```typescript
if (loading) {
    return <LoadingSpinner />;
}

if (!data) {
    return <ErrorMessage />;
}
```

### 3. Fallbacks pour les données manquantes

Toujours fournir des valeurs par défaut :

```typescript
const user = conversation.buyer || {
	name: "Utilisateur",
	image: null,
	username: null,
};
```

## Support

En cas de problème persistant :

1. **Vérifier les logs** de la console et du serveur
2. **Tester les API** individuellement avec le script de test
3. **Vérifier la base de données** pour s'assurer que les données existent
4. **Consulter la documentation** des endpoints
5. **Vérifier la version** de Next.js et des dépendances

---

**💡 Conseil :** Toujours tester avec des données réelles et gérer les cas d'erreur gracieusement !
