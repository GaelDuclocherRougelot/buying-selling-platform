# Guide de Dépannage WebSocket

## Problèmes Résolus

### 1. Boucle Infinie de Connexions

**Symptômes :** Logs montrant de nombreuses connexions WebSocket successives
**Cause :** Reconnexions automatiques excessives et gestion des sessions
**Solution :**

- Ajout de gardes contre les reconnexions multiples
- Limitation du nombre de tentatives de reconnexion
- Délai entre les tentatives de connexion

### 2. Messages qui ne s'affichent pas en Direct

**Symptômes :** Messages envoyés mais non reçus en temps réel
**Cause :** Problèmes de gestion des événements et synchronisation
**Solution :**

- Amélioration de la gestion des événements WebSocket
- Vérification des doublons de messages
- Marquage automatique des messages comme lus

### 3. Connexions Multiples

**Symptômes :** Un même utilisateur connecté sur plusieurs sockets
**Cause :** Manque de gestion des connexions existantes
**Solution :**

- Suivi des utilisateurs connectés côté serveur
- Déconnexion automatique des anciens sockets
- Nettoyage des connexions orphelines

## Utilisation

### Démarrage du Serveur WebSocket

```bash
# Option 1: Script dédié (recommandé)
npm run dev:websocket

# Option 2: Script complet (Next.js + WebSocket)
npm run dev:full

# Option 3: Manuel
npx tsx src/lib/websocket-server.ts
```

### Test du Serveur

```bash
# Test de connexion WebSocket
npm run test:websocket

# Ou manuellement
node scripts/test-websocket.js
```

### Variables d'Environnement

```env
# Port du serveur WebSocket
WEBSOCKET_PORT=3001

# URL du serveur WebSocket côté client
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

### Côté Serveur (`websocket-server.ts`)

- Gestion des connexions avec authentification
- Suivi des utilisateurs connectés
- Émission des messages aux rooms de conversation
- Nettoyage automatique des connexions

### Côté Client (`WebSocketContext.tsx`)

- Gestion de la connexion avec reconnexion intelligente
- Authentification automatique
- Gestion des événements avec handlers
- Protection contre les connexions multiples

### Composants Utilisateurs

- `MessagesPage.tsx` : Gestion des conversations
- `WebSocketStatus.tsx` : Statut de la connexion
- `ChatWindow.tsx` : Interface de chat

## Dépannage

### Vérifier la Connexion

1. **Statut WebSocket** : Regarder l'indicateur dans l'interface
2. **Console du navigateur** : Vérifier les logs de connexion
3. **Serveur WebSocket** : Vérifier les logs du serveur

### Problèmes Courants

#### Connexion Refusée

```bash
# Vérifier que le serveur WebSocket est démarré
lsof -i :3001

# Redémarrer le serveur
npm run dev:websocket
```

#### Messages Non Reçus

1. Vérifier que l'utilisateur est authentifié
2. Vérifier que la conversation est rejointe
3. Vérifier les logs côté serveur

#### Reconnexions Excessives

1. Vérifier la stabilité de la connexion réseau
2. Vérifier les paramètres de reconnexion
3. Redémarrer le client WebSocket

### Logs Utiles

#### Côté Serveur

```
✅ WebSocket connecté avec succès
🔐 Authentification de l'utilisateur: [userId]
📨 Message reçu du client: [data]
📡 Émission du message à la conversation [id]
```

#### Côté Client

```
✅ WebSocket connecté avec succès
🔐 Authentification de l'utilisateur: [userId]
🚀 Rejoindre la conversation: [id]
📨 Message reçu sur WebSocket: [message]
```

## Performance

### Optimisations Appliquées

- Limitation des tentatives de reconnexion (3 max)
- Délai entre les tentatives (2-10 secondes)
- Nettoyage périodique des connexions (30 secondes)
- Gestion des timeouts (60 secondes)

### Monitoring

- Nombre d'utilisateurs connectés
- Taux de reconnexion
- Latence des messages
- Utilisation mémoire

## Sécurité

### Mesures Implémentées

- Authentification obligatoire avant utilisation
- Vérification des permissions de conversation
- Validation des données entrantes
- Limitation des connexions par origine

### Bonnes Pratiques

- Toujours vérifier l'authentification
- Valider les données avant traitement
- Logger les actions importantes
- Nettoyer les ressources à la déconnexion
