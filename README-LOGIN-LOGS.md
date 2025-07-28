# Système de Logs de Connexion - Guide d'utilisation

## 🚀 Installation et Configuration

### 1. Base de données

Le système utilise une table `login_logs` dans PostgreSQL. La migration a déjà été appliquée.

### 2. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Secret pour sécuriser les endpoints cron
CRON_SECRET=your-secret-key-here
```

## 📊 Interface d'administration

### Accès

- **URL** : `/admin/login-logs`
- **Permissions** : Nécessite le rôle `admin`

### Fonctionnalités

- ✅ Visualisation des logs de connexion
- ✅ Filtres par utilisateur, action, statut
- ✅ Statistiques en temps réel
- ✅ Pagination et tri
- ✅ Export des données (à implémenter)

## 🔧 API Endpoints

### Pour les administrateurs

- `GET /api/admin/login-logs` - Récupérer les logs avec filtres
- `POST /api/admin/login-logs` - Créer un log (admin uniquement)
- `GET /api/admin/login-logs/stats` - Statistiques de connexion

### Pour les utilisateurs

- `POST /api/login-logs` - Logger ses propres actions

### Maintenance

- `POST /api/cron/cleanup-logs` - Nettoyage automatique (cron)

## 💻 Utilisation dans le code

### Logger une connexion réussie

```typescript
import { LoginLogger } from "@/lib/login-logger";

// Dans votre composant de connexion
const handleLogin = async (credentials) => {
	try {
		const result = await signIn(credentials);
		if (result.success) {
			await LoginLogger.logSuccessfulLogin(
				result.user.id,
				getClientIP(),
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

### Utiliser le bouton de déconnexion avec logging

```tsx
import { LogoutButton } from "@/components/auth/logout-button";

<LogoutButton variant="outline" size="lg">
	Se déconnecter
</LogoutButton>;
```

### Récupérer des statistiques

```typescript
import { LoginLogService } from "@/services/login-log";

// Statistiques globales (30 derniers jours)
const stats = await LoginLogService.getLoginStats();

// Statistiques pour un utilisateur spécifique
const userStats = await LoginLogService.getLoginStats("user-id", 7);
```

## 🛠 Scripts utilitaires

### Test du système

```bash
# Ajouter des logs de test
npx tsx scripts/test-login-logs.ts
```

### Nettoyage manuel

```bash
# Supprimer les logs de plus de 90 jours
npx tsx scripts/cleanup-logs.ts
```

## 🔄 Nettoyage automatique

### Configuration cron

Ajoutez cette ligne à votre crontab pour un nettoyage quotidien :

```bash
# Nettoyage des logs à 2h du matin
0 2 * * * curl -X POST https://your-domain.com/api/cron/cleanup-logs \
  -H "Authorization: Bearer your-cron-secret"
```

### Vercel Cron Jobs

Si vous utilisez Vercel, ajoutez ceci à votre `vercel.json` :

```json
{
	"crons": [
		{
			"path": "/api/cron/cleanup-logs",
			"schedule": "0 2 * * *"
		}
	]
}
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Limitation de taux** : Implémentez des limites pour les tentatives de connexion
2. **Surveillance** : Consultez régulièrement les logs pour détecter les anomalies
3. **Nettoyage** : Supprimez les anciens logs pour éviter l'accumulation
4. **Chiffrement** : Les données sensibles sont stockées de manière sécurisée

### Détection d'anomalies

```typescript
// Vérifier les tentatives suspectes
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

## 📈 Monitoring

### Métriques importantes

- **Taux de réussite** : Connexions réussies / total
- **Tentatives échouées** : Détection d'attaques par force brute
- **IPs uniques** : Détection d'activité suspecte
- **Patterns temporels** : Heures de connexion inhabituelles

### Alertes recommandées

- Plus de 10 échecs de connexion en 1 heure pour un utilisateur
- Connexions depuis des IPs inhabituelles
- Tentatives de connexion en dehors des heures normales

## 🐛 Dépannage

### Problèmes courants

#### Erreur "Cannot read properties of undefined"

- **Cause** : Client Prisma non régénéré
- **Solution** : `npx prisma generate`

#### Erreur "Accès non autorisé"

- **Cause** : Utilisateur sans permissions admin
- **Solution** : Vérifier le rôle de l'utilisateur

#### Logs non créés

- **Cause** : Erreur dans l'API route
- **Solution** : Vérifier les logs du serveur

### Logs de débogage

Activez les logs détaillés en ajoutant :

```typescript
console.log("Login attempt:", { userId, action, success });
```

## 📚 Documentation complète

Pour plus de détails, consultez :

- `docs/login-logs.md` - Documentation technique complète
- `src/types/login-log.ts` - Types TypeScript
- `src/services/login-log.ts` - Service principal

## 🤝 Support

En cas de problème :

1. Vérifiez les logs du serveur
2. Consultez la documentation technique
3. Testez avec les scripts utilitaires
4. Vérifiez la base de données

---

**Note** : Ce système est conçu pour améliorer la sécurité et la traçabilité des connexions. Utilisez-le de manière responsable et conformément aux réglementations sur la protection des données.
