# Système de Logs de Connexion

Ce document décrit le système de logs de connexion implémenté pour tracer les activités d'authentification des utilisateurs.

## Vue d'ensemble

Le système de logs de connexion permet de :

- Tracer toutes les tentatives de connexion (réussies et échouées)
- Enregistrer les déconnexions
- Suivre les réinitialisations de mot de passe
- Détecter les tentatives de connexion suspectes
- Fournir des statistiques de sécurité

## Structure de la base de données

### Table `login_logs`

```sql
CREATE TABLE login_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  location TEXT,
  success BOOLEAN DEFAULT true,
  failureReason TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

### Champs

- `id` : Identifiant unique du log
- `userId` : ID de l'utilisateur concerné
- `action` : Type d'action (`login`, `logout`, `failed_login`, `password_reset`, `account_locked`)
- `ipAddress` : Adresse IP de l'utilisateur
- `userAgent` : User-Agent du navigateur
- `location` : Localisation géographique (optionnel)
- `success` : Indique si l'action a réussi
- `failureReason` : Raison de l'échec (si applicable)
- `createdAt` : Timestamp de création

## API Endpoints

### GET `/api/login-logs`

Récupère les logs de connexion avec filtres.

**Paramètres de requête :**

- `userId` : Filtrer par utilisateur spécifique
- `action` : Filtrer par type d'action
- `success` : Filtrer par statut (true/false)
- `limit` : Nombre de résultats (défaut: 50)
- `offset` : Pagination (défaut: 0)

**Réponse :**

```json
{
	"logs": [
		{
			"id": "clx123...",
			"userId": "user123",
			"action": "login",
			"ipAddress": "192.168.1.1",
			"userAgent": "Mozilla/5.0...",
			"location": "Paris, France",
			"success": true,
			"createdAt": "2024-01-15T10:30:00Z"
		}
	]
}
```

### POST `/api/login-logs`

Crée un nouveau log de connexion.

**Corps de la requête :**

```json
{
	"action": "login",
	"ipAddress": "192.168.1.1",
	"userAgent": "Mozilla/5.0...",
	"location": "Paris, France",
	"success": true,
	"failureReason": null
}
```

### GET `/api/login-logs/stats`

Récupère les statistiques de connexion.

**Paramètres de requête :**

- `userId` : Statistiques pour un utilisateur spécifique (optionnel)
- `days` : Période en jours (défaut: 30)

**Réponse :**

```json
{
	"stats": {
		"totalLogins": 150,
		"successfulLogins": 145,
		"failedLogins": 5,
		"uniqueIPs": 25
	}
}
```

## Services

### LoginLogService

Classe utilitaire pour gérer les logs de connexion.

```typescript
import { LoginLogService } from "@/services/login-log";

// Créer un log
await LoginLogService.create({
	userId: "user123",
	action: "login",
	ipAddress: "192.168.1.1",
	userAgent: "Mozilla/5.0...",
	success: true,
});

// Récupérer les logs avec filtres
const logs = await LoginLogService.findMany({
	userId: "user123",
	action: "failed_login",
	limit: 10,
});

// Obtenir les statistiques
const stats = await LoginLogService.getLoginStats("user123", 30);
```

### LoginLogger

Classe utilitaire pour logger automatiquement les actions d'authentification.

```typescript
import { LoginLogger } from "@/lib/login-logger";

// Logger une connexion réussie
await LoginLogger.logSuccessfulLogin(userId, ipAddress, userAgent, location);

// Logger un échec de connexion
await LoginLogger.logFailedLogin(
	userId,
	"Mot de passe incorrect",
	ipAddress,
	userAgent
);

// Logger une déconnexion
await LoginLogger.logLogout(userId, ipAddress, userAgent);
```

## Composants React

### LoginLogsTable

Tableau pour afficher et filtrer les logs de connexion.

```tsx
import { LoginLogsTable } from "@/components/admin/login-logs-table";

<LoginLogsTable initialLogs={[]} />;
```

### LoginStats

Composant pour afficher les statistiques de connexion.

```tsx
import { LoginStats } from "@/components/admin/login-stats";

<LoginStats initialStats={stats} />;
```

### LogoutButton

Bouton de déconnexion qui log automatiquement l'action.

```tsx
import { LogoutButton } from "@/components/auth/logout-button";

<LogoutButton variant="outline" size="lg">
	Se déconnecter
</LogoutButton>;
```

## Intégration avec l'authentification

### Logging automatique des connexions

Pour logger automatiquement les connexions, vous pouvez utiliser le `LoginLogger` dans vos composants d'authentification :

```tsx
// Dans un composant de connexion
const handleLogin = async (credentials) => {
	try {
		const result = await signIn(credentials);
		if (result.success) {
			await LoginLogger.logSuccessfulLogin(
				result.user.id,
				getClientIP(), // Fonction pour récupérer l'IP
				navigator.userAgent
			);
		}
	} catch (error) {
		await LoginLogger.logFailedLogin(
			credentials.email,
			error.message,
			getClientIP(),
			navigator.userAgent
		);
	}
};
```

### Détection de tentatives suspectes

Le service fournit des méthodes pour détecter les tentatives suspectes :

```typescript
// Compter les échecs récents
const failedAttempts = await LoginLogService.countRecentFailedLogins(
	userId,
	24 // heures
);

if (failedAttempts > 5) {
	// Verrouiller le compte ou demander une vérification
	await LoginLogger.logAccountLocked(
		userId,
		"Trop de tentatives échouées",
		ipAddress,
		userAgent
	);
}
```

## Sécurité

### Bonnes pratiques

1. **Limitation de taux** : Implémentez des limites de taux pour les tentatives de connexion
2. **Nettoyage automatique** : Supprimez les anciens logs régulièrement
3. **Chiffrement** : Stockez les données sensibles de manière sécurisée
4. **Audit** : Consultez régulièrement les logs pour détecter les anomalies

### Nettoyage automatique

```typescript
// Supprimer les logs de plus de 90 jours
const deletedCount = await LoginLogService.deleteOldLogs(90);
console.log(`${deletedCount} logs supprimés`);
```

## Interface d'administration

L'interface d'administration est accessible via `/admin/login-logs` et permet de :

- Visualiser tous les logs de connexion
- Filtrer par utilisateur, action, statut
- Voir les statistiques en temps réel
- Exporter les données (à implémenter)

## Monitoring et alertes

Pour un monitoring avancé, vous pouvez :

1. **Créer des alertes** pour les tentatives suspectes
2. **Analyser les patterns** de connexion
3. **Détecter les attaques** par force brute
4. **Générer des rapports** de sécurité

## Exemples d'utilisation

### Script de nettoyage automatique

```typescript
// scripts/cleanup-logs.ts
import { LoginLogService } from "@/services/login-log";

async function cleanupOldLogs() {
	try {
		const deletedCount = await LoginLogService.deleteOldLogs(90);
		console.log(`Nettoyage terminé : ${deletedCount} logs supprimés`);
	} catch (error) {
		console.error("Erreur lors du nettoyage:", error);
	}
}

cleanupOldLogs();
```

### Middleware de sécurité

```typescript
// middleware/security.ts
import { LoginLogService } from "@/services/login-log";

export async function checkLoginAttempts(userId: string, ipAddress: string) {
	const failedAttempts = await LoginLogService.countRecentFailedLogins(
		userId,
		1
	);

	if (failedAttempts > 3) {
		throw new Error("Trop de tentatives échouées. Réessayez plus tard.");
	}
}
```

## Support

Pour toute question ou problème avec le système de logs de connexion, consultez :

1. La documentation de l'API
2. Les logs d'erreur de l'application
3. La base de données pour vérifier l'intégrité des données
