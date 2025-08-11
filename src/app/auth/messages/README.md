# Système de Messagerie

Ce système de messagerie permet aux acheteurs et vendeurs de communiquer en temps réel via WebSocket.

## Fonctionnalités

- **Conversations en temps réel** : Communication instantanée entre utilisateurs
- **Notifications** : Indicateurs visuels pour les nouveaux messages
- **Statut de connexion** : Affichage du statut WebSocket
- **Recherche** : Recherche dans les conversations existantes
- **Interface responsive** : Adaptation mobile et desktop

## Architecture

### Base de données

- **Conversation** : Stocke les conversations entre acheteurs et vendeurs
- **Message** : Stocke les messages individuels avec statut de lecture

### WebSocket

- **Authentification** : Vérification de l'identité des utilisateurs
- **Rooms** : Chaque conversation est une "room" WebSocket
- **Typing indicators** : Indicateurs de frappe en temps réel

### API Routes

- `GET /api/messages/conversations` : Liste des conversations
- `POST /api/messages/conversations` : Créer une conversation
- `GET /api/messages/conversations/[id]` : Messages d'une conversation
- `POST /api/messages/send` : Envoyer un message

## Utilisation

### Démarrer le serveur avec WebSocket

```bash
pnpm run dev:websocket
```

### Démarrer le serveur normal

```bash
pnpm run dev
```

### Composants disponibles

#### StartConversationButton

Bouton pour démarrer une conversation depuis une page produit :

```tsx
<StartConversationButton
	productId="product-123"
	sellerId="seller-456"
	sellerName="Nom du vendeur"
/>
```

#### MessageNotifications

Indicateur de nouveaux messages dans le header :

```tsx
<MessageNotifications />
```

#### WebSocketStatus

Statut de la connexion WebSocket :

```tsx
<WebSocketStatus />
```

## Intégration dans les pages

### Page produit

Ajouter le bouton de contact :

```tsx
import StartConversationButton from "@/components/messages/StartConversationButton";

// Dans le composant produit
<StartConversationButton
	productId={product.id}
	sellerId={product.ownerId}
	sellerName={product.owner.name}
/>;
```

### Header

Ajouter les notifications de messages :

```tsx
import MessageNotifications from "@/components/messages/MessageNotifications";

// Dans le header
<MessageNotifications />;
```

## Sécurité

- Vérification de l'authentification pour toutes les routes
- Validation des permissions (utilisateur participant à la conversation)
- Protection contre l'auto-messagerie
- Validation des données d'entrée

## Performance

- Messages chargés à la demande
- Pagination des conversations
- Mise en cache des données utilisateur
- Optimisation des requêtes Prisma

## Développement

### Ajouter de nouveaux types de messages

1. Étendre l'interface `Message` dans `types/conversation.ts`
2. Mettre à jour le composant `ChatWindow`
3. Ajouter la logique de traitement dans l'API

### Ajouter des fonctionnalités WebSocket

1. Étendre la classe `WebSocketManager`
2. Ajouter les événements dans le hook `useWebSocket`
3. Mettre à jour les composants clients

## Dépannage

### WebSocket ne se connecte pas

- Vérifier que le serveur WebSocket est démarré
- Contrôler les logs du serveur
- Vérifier la configuration CORS

### Messages non reçus en temps réel

- Vérifier la connexion WebSocket
- Contrôler les logs de l'API
- Vérifier les permissions de la conversation
