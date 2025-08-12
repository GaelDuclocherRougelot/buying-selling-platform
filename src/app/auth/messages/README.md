# Système de Messagerie - Architecture REST

## Vue d'ensemble

Ce système de messagerie utilise une architecture REST complète au lieu du temps réel (WebSocket/Ably). Il est conçu pour être simple, fiable et facile à maintenir.

## Architecture

### API Endpoints

#### 1. Conversations

- **GET** `/api/messages/conversations` - Récupérer toutes les conversations de l'utilisateur
- **POST** `/api/messages/conversations` - Créer une nouvelle conversation

#### 2. Messages

- **GET** `/api/messages/conversations/[conversationId]/messages` - Récupérer les messages d'une conversation
- **POST** `/api/messages/send` - Envoyer un nouveau message

#### 3. Gestion des messages

- **POST** `/api/messages/conversations/[conversationId]/read` - Marquer les messages comme lus

### Hook personnalisé : `useMessages`

Le hook `useMessages` fournit toutes les fonctionnalités nécessaires :

```typescript
const {
	loading, // État de chargement
	sending, // État d'envoi
	fetchConversations, // Récupérer les conversations
	fetchConversationMessages, // Récupérer les messages
	sendMessage, // Envoyer un message
	markMessagesAsRead, // Marquer comme lus
	createConversation, // Créer une conversation
	refreshMessages, // Rafraîchir les messages
} = useMessages();
```

## Fonctionnalités

### 1. Gestion des conversations

- Liste des conversations avec dernier message
- Compteur de messages non lus
- Tri par date de mise à jour

### 2. Envoi de messages

- Support des types de messages (texte, image, fichier)
- Validation côté serveur
- Mise à jour immédiate de l'interface

### 3. Polling intelligent

- Vérification automatique des nouveaux messages toutes les 5 secondes
- Mise à jour en temps réel de l'interface
- Marquage automatique des messages comme lus

### 4. Gestion des erreurs

- Gestion gracieuse des erreurs réseau
- Messages d'erreur utilisateur
- Fallbacks en cas d'échec

## Avantages de l'architecture REST

### ✅ Simplicité

- Pas de gestion de connexions WebSocket
- Pas de gestion d'état de connexion
- API standard et prévisible

### ✅ Fiabilité

- Pas de déconnexions inattendues
- Gestion automatique des erreurs réseau
- Retry automatique via le polling

### ✅ Maintenabilité

- Code plus simple et lisible
- Moins de dépendances externes
- Debugging plus facile

### ✅ Scalabilité

- Pas de limite de connexions simultanées
- Gestion standard des timeouts
- Cache HTTP standard

## Utilisation

### Dans un composant

```typescript
import { useMessages } from "@/lib/hooks/useMessages";

function MyComponent() {
  const { sendMessage, loading } = useMessages();

  const handleSend = async () => {
    const message = await sendMessage(conversationId, "Hello!", "text");
    if (message) {
      console.log("Message envoyé:", message);
    }
  };

  return (
    <button onClick={handleSend} disabled={loading}>
      Envoyer
    </button>
  );
}
```

### Polling automatique

Le polling se fait automatiquement quand une conversation est sélectionnée :

```typescript
const handleConversationSelect = async (conversation: Conversation) => {
	// Charger les messages
	const fullConversation = await fetchConversationMessagesLocal(
		conversation.id
	);
	setSelectedConversation(fullConversation);

	// Démarrer le polling automatiquement
	startPolling(conversation.id);
};
```

## Configuration

### Variables d'environnement

Aucune configuration spéciale n'est requise. Le système utilise les endpoints API standard de Next.js.

### Base de données

Le système utilise Prisma avec les modèles suivants :

- `Conversation` - Conversations entre utilisateurs
- `Message` - Messages individuels
- `User` - Utilisateurs du système

## Migration depuis WebSocket

### Supprimé

- `WebSocketContext.tsx`
- Dépendances `socket.io` et `ably`
- Gestion des connexions en temps réel

### Remplacé par

- Hook `useMessages` pour la gestion des données
- Polling automatique pour la mise à jour
- API REST standard pour toutes les opérations

## Performance

### Optimisations

- Polling intelligent (5 secondes)
- Mise à jour locale de l'état
- Gestion des timeouts et reconnexions

### Monitoring

- Indicateurs de chargement et d'envoi
- Gestion des erreurs avec retry
- Logs de debug pour le développement

## Support

Pour toute question ou problème :

1. Vérifier les logs de la console
2. Contrôler les réponses de l'API
3. Vérifier la connectivité réseau
4. Consulter la documentation des endpoints
