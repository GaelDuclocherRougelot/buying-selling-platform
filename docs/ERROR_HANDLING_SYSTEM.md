# Système de Gestion d'Erreur Global

Ce document décrit le système de gestion d'erreur centralisé mis en place dans l'application.

## 🏗️ Architecture

Le système de gestion d'erreur est composé de plusieurs éléments :

### 1. Service de Gestion d'Erreur (`src/lib/error-handler.ts`)

Classe singleton qui centralise toute la logique de gestion d'erreur :

- **Normalisation des erreurs** : Convertit différents types d'erreurs en format standardisé
- **Gestion des erreurs API** : Traite automatiquement les codes de statut HTTP
- **Logging** : Console, serveur et historique local
- **Affichage** : Toasts d'erreur avec configuration
- **Récupération** : Détection des erreurs récupérables

### 2. Hooks React (`src/lib/hooks/useErrorHandler.ts`)

Hooks personnalisés pour faciliter l'utilisation dans les composants React :

- `useErrorHandler()` : Accès aux méthodes de gestion d'erreur
- `useApiErrorHandler()` : Wrapper pour les requêtes fetch
- `useAsyncErrorHandler()` : Gestion des opérations asynchrones

### 3. Error Boundary (`src/components/error/ErrorBoundary.tsx`)

Composant React pour capturer les erreurs JavaScript :

- Capture les erreurs dans l'arbre des composants
- Affiche une UI de fallback élégante
- Intégration avec le système de logging global

### 4. Pages d'Erreur Next.js

- `src/app/error.tsx` : Erreurs au niveau des pages
- `src/app/global-error.tsx` : Erreurs au niveau du layout

### 5. API de Logging (`src/app/api/error-log/route.ts`)

Endpoint pour logger les erreurs côté serveur avec stockage en base de données.

### 6. Table ErrorLog (Prisma)

Nouvelle table dans la base de données pour stocker les erreurs de manière persistante.

## 📊 Structure de la Table ErrorLog

```sql
model ErrorLog {
  id          String    @id @default(cuid())
  message     String
  code        String?
  status      Int?
  path        String?
  userId      String?
  userAgent   String?
  ip          String?
  details     Json?
  timestamp   DateTime  @default(now())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  user        User?     @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("error_logs")
}
```

## 🚀 Utilisation

### Gestion d'Erreur Basique

```typescript
import { handleError } from "@/lib/error-handler";

try {
	// Code qui peut générer une erreur
} catch (error) {
	handleError(error, {
		fallbackMessage: "Erreur personnalisée",
		showToast: true,
		logToConsole: true,
	});
}
```

### Gestion d'Erreur API

```typescript
import { handleApiError } from "@/lib/error-handler";

const response = await fetch("/api/data");
if (!response.ok) {
	handleApiError(response, "Erreur lors du chargement des données");
}
```

### Utilisation dans les Composants React

```typescript
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, handleApiError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        handleApiError(response);
        return;
      }
      // Traitement des données
    } catch (error) {
      handleError(error, {
        fallbackMessage: "Erreur lors du chargement"
      });
    }
  };

  return <div>...</div>;
}
```

### Requêtes API Sécurisées

```typescript
import { useApiErrorHandler } from '@/lib/hooks/useErrorHandler';

function MyComponent() {
  const { safeFetch } = useApiErrorHandler();

  const fetchData = async () => {
    const response = await safeFetch(
      '/api/data',
      { method: 'GET' },
      "Erreur lors du chargement"
    );

    if (response.ok) {
      const data = await response.json();
      // Traitement des données
    }
  };

  return <div>...</div>;
}
```

### Opérations Asynchrones

```typescript
import { useAsyncErrorHandler } from '@/lib/hooks/useErrorHandler';

function MyComponent() {
  const { withErrorHandling } = useAsyncErrorHandler();

  const processData = async () => {
    const result = await withErrorHandling(
      async () => {
        // Opération asynchrone
        return await someAsyncOperation();
      },
      "Erreur lors du traitement",
      { showToast: true }
    );

    if (result) {
      // Utiliser le résultat
    }
  };

  return <div>...</div>;
}
```

### Error Boundary

```typescript
import { ErrorBoundary, SimpleErrorFallback } from '@/components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<SimpleErrorFallback />}
      onError={(error, errorInfo) => {
        console.log('Erreur capturée:', error, errorInfo);
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## ⚙️ Configuration

### Types d'Erreur Supportés

- **Erreurs JavaScript** : `Error`, `TypeError`, etc.
- **Erreurs API** : Codes de statut HTTP (400, 401, 403, 404, 500, etc.)
- **Erreurs de validation** : Erreurs de schéma Zod, etc.
- **Erreurs d'authentification** : Redirection automatique vers login
- **Erreurs réseau** : Timeout, connexion perdue, etc.

### Codes de Statut HTTP Gérés

| Code    | Message                   | Action                    |
| ------- | ------------------------- | ------------------------- |
| 400     | Requête invalide          | Toast d'erreur            |
| 401     | Vous devez être connecté  | Toast + redirection login |
| 403     | Accès refusé              | Toast d'erreur            |
| 404     | Ressource non trouvée     | Toast d'erreur            |
| 409     | Conflit de données        | Toast d'erreur            |
| 422     | Données invalides         | Toast d'erreur            |
| 429     | Trop de requêtes          | Toast d'erreur            |
| 500     | Erreur interne du serveur | Toast + logging serveur   |
| 502-504 | Service indisponible      | Toast d'erreur            |

### Options de Configuration

```typescript
interface ErrorConfig {
	showToast?: boolean; // Afficher un toast (défaut: true)
	logToConsole?: boolean; // Logger dans la console (défaut: true)
	logToServer?: boolean; // Logger sur le serveur (défaut: false)
	fallbackMessage?: string; // Message de fallback
}
```

## 🔄 Migration depuis l'Ancien Système

### Avant (Ancien Code)

```typescript
try {
	const response = await fetch("/api/data");
	if (!response.ok) {
		toast.error("Erreur lors du chargement");
		return;
	}
	const data = await response.json();
} catch (error) {
	console.error("Erreur:", error);
	toast.error("Une erreur s'est produite");
}
```

### Après (Nouveau Système)

```typescript
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";

function MyComponent() {
	const { handleApiError } = useErrorHandler();

	const fetchData = async () => {
		try {
			const response = await fetch("/api/data");
			if (!response.ok) {
				handleApiError(response, "Erreur lors du chargement");
				return;
			}
			const data = await response.json();
		} catch (error) {
			// Gestion automatique via handleApiError
		}
	};
}
```

## 📈 Fonctionnalités Avancées

### Historique des Erreurs

```typescript
import { errorHandler } from "@/lib/error-handler";

// Récupérer l'historique
const errorLog = errorHandler.getErrorLog();

// Vider l'historique
errorHandler.clearErrorLog();
```

### Détection d'Erreurs Récupérables

```typescript
import { errorHandler } from "@/lib/error-handler";

const error = handleError(someError);
if (errorHandler.isRecoverableError(error)) {
	// Tenter une récupération
	retryOperation();
}
```

### Logging Personnalisé

```typescript
handleError(error, {
	showToast: false, // Pas de toast
	logToConsole: true, // Logger dans la console
	logToServer: true, // Logger sur le serveur
	fallbackMessage: "Message personnalisé",
});
```

## 🛠️ Administration

### Page de Gestion des Logs d'Erreur

Une nouvelle page d'administration est disponible à `/admin/error-logs` pour :

- **Visualiser** tous les logs d'erreur
- **Filtrer** par type d'erreur, utilisateur, date
- **Supprimer** des logs individuels ou tous les logs
- **Exporter** les données pour analyse

### Accès

Seuls les utilisateurs avec le rôle `admin` peuvent accéder à cette page.

## 📝 Bonnes Pratiques

1. **Utiliser les hooks** plutôt que d'importer directement les fonctions
2. **Fournir des messages d'erreur clairs** et utiles pour l'utilisateur
3. **Logger les erreurs serveur** pour les erreurs 500+
4. **Utiliser les Error Boundaries** pour capturer les erreurs React
5. **Éviter les try/catch multiples** - laisser le système global gérer
6. **Tester les cas d'erreur** dans vos composants

## 🔍 Développement

### Mode Développement

En mode développement, les erreurs affichent :

- Stack trace complète
- Détails de l'erreur
- Informations de débogage

### Mode Production

En production, les erreurs affichent :

- Messages utilisateur-friendly
- Pas de stack trace
- Logging automatique sur le serveur

## 🚀 Extension Future

Pour étendre le système :

1. **Ajouter de nouveaux types d'erreur** dans `ErrorHandler`
2. **Créer des hooks spécialisés** pour des cas d'usage spécifiques
3. **Ajouter des métriques** et alertes pour les erreurs critiques
4. **Implémenter des notifications** Slack/Email pour les erreurs importantes
5. **Ajouter des graphiques** de tendances d'erreurs

## 📚 Exemples Complets

Consultez le composant `src/components/examples/ErrorHandlingExample.tsx` pour des exemples d'utilisation complets.

## 🔧 Dépannage

### Erreurs Courantes

1. **Erreur Prisma** : Vérifiez que la migration a été appliquée
2. **Erreur de type** : Assurez-vous d'importer les bons types
3. **Erreur de hook** : Vérifiez que le composant est dans un contexte React

### Logs

- **Console** : Erreurs détaillées en développement
- **Base de données** : Historique persistant des erreurs
- **Serveur** : Logs des erreurs critiques

---

**💡 Conseil :** Commencez par utiliser les hooks de base, puis explorez les fonctionnalités avancées selon vos besoins !
