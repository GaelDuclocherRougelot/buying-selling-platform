# 🧹 Guide de Résolution des Problèmes de Cache

## 🚨 **Problèmes Courants de Cache**

### **1. Comportements Incohérents**

- Les corrections de code ne semblent pas s'appliquer
- Les statuts de paiement changent de manière inattendue
- Les routes API retournent des résultats anciens
- L'interface affiche des données obsolètes

### **2. Processus Multiples**

- Plusieurs instances de Next.js qui tournent en même temps
- Conflits entre différents processus de développement
- Ports déjà utilisés

## 🛠️ **Solutions Immédiates**

### **Script de Nettoyage Complet**

```bash
./scripts/clean-cache.sh
```

### **Script de Redémarrage Propre**

```bash
./scripts/restart-dev.sh
```

## 🔍 **Diagnostic Manuel**

### **Vérifier les Processus Actifs**

```bash
ps aux | grep -E "(next|tsx)" | grep -v grep
```

### **Vérifier les Ports Utilisés**

```bash
lsof -i :3000
lsof -i :3001
```

### **Nettoyage Manuel**

```bash
# Arrêter tous les processus
pkill -f "next-server"
pkill -f "tsx"
pkill -f "pnpm dev"

# Supprimer les caches
rm -rf .next
rm -rf node_modules/.cache

# Redémarrer
pnpm dev
```

## 📋 **Checklist de Résolution**

### **Avant de Tester une Correction**

1. ✅ Utiliser `./scripts/clean-cache.sh`
2. ✅ Vérifier qu'aucun processus ne tourne
3. ✅ Redémarrer avec `pnpm dev`
4. ✅ Attendre que l'app soit complètement chargée

### **Si le Problème Persiste**

1. ✅ Vérifier les logs de la console
2. ✅ Vérifier les logs du serveur
3. ✅ Tester avec un navigateur en mode incognito
4. ✅ Vider le cache du navigateur

## 🚀 **Bonnes Pratiques**

### **Développement**

- Toujours nettoyer le cache avant de tester des corrections importantes
- Utiliser les scripts automatisés plutôt que le nettoyage manuel
- Vérifier l'état des processus avant de commencer à coder

### **Déploiement**

- Toujours redémarrer l'application après des modifications de code
- Vérifier que les nouvelles routes sont bien prises en compte
- Tester avec des données fraîches

## 🔧 **Scripts Disponibles**

| Script           | Description                  | Usage                      |
| ---------------- | ---------------------------- | -------------------------- |
| `clean-cache.sh` | Nettoyage complet des caches | `./scripts/clean-cache.sh` |
| `restart-dev.sh` | Redémarrage propre complet   | `./scripts/restart-dev.sh` |

## 📞 **En Cas de Problème Persistant**

1. **Exécuter le nettoyage complet**
2. **Vérifier les logs d'erreur**
3. **Redémarrer l'application**
4. **Tester avec des données de test**
5. **Si nécessaire, redémarrer l'ordinateur**

---

**💡 Conseil :** Utilisez toujours `./scripts/clean-cache.sh` avant de tester des corrections importantes pour éviter les comportements incohérents !
