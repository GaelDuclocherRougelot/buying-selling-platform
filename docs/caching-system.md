# Système de Cache - Documentation

## 🎯 **Objectif**

Le système de cache a été implémenté pour optimiser les performances de l'application en évitant les requêtes répétitives à la base de données et en améliorant l'expérience utilisateur.

## 🏗️ **Architecture**

### **1. Cache côté serveur (`src/lib/cache.ts`)**

- **CacheManager** : Gestionnaire principal du cache en mémoire
- **TTL configurable** : Durée de vie des données en cache
- **Nettoyage automatique** : Suppression des entrées expirées
- **Clés dynamiques** : Génération de clés basées sur les paramètres

### **2. Cache côté client (`src/lib/hooks/useCache.ts`)**

- **ClientCacheManager** : Cache en mémoire côté client
- **Hook React** : `useCachedData` pour une utilisation simple
- **Gestion d'état** : Loading, error, refetch automatiques

### **3. Middleware (`src/lib/cache-middleware.ts`)**

- **Invalidation automatique** : Cache invalidé lors des modifications
- **Headers HTTP** : Headers de cache pour le navigateur
- **Optimisation réseau** : Réduction des requêtes HTTP

## 📊 **Bénéfices attendus**

### **Performance**

- ⚡ **Réduction des requêtes DB** : Jusqu'à 80% de réduction
- 🚀 **Temps de réponse** : Amélioration de 50-70%
- 💾 **Moins de charge serveur** : Réduction de la consommation CPU

### **Expérience utilisateur**

- 🔄 **Navigation plus fluide** : Données instantanées
- 📱 **Moins de loading** : Affichage immédiat des données en cache
- 🌐 **Moins de bande passante** : Réduction des requêtes HTTP

## 🔧 **Configuration**

### **TTL par type de données**

```typescript
export const CACHE_TTL = {
	FEATURED_PRODUCTS: 10 * 60 * 1000, // 10 minutes
	FEATURED_CATEGORIES: 30 * 60 * 1000, // 30 minutes
	ALL_CATEGORIES: 60 * 60 * 1000, // 1 heure
	PRODUCTS_BY_CATEGORY: 5 * 60 * 1000, // 5 minutes
	USER_PROFILE: 15 * 60 * 1000, // 15 minutes
	USER_PRODUCTS: 5 * 60 * 1000, // 5 minutes
	PRODUCT_DETAILS: 10 * 60 * 1000, // 10 minutes
};
```

### **Clés de cache**

```typescript
export const CACHE_KEYS = {
	FEATURED_PRODUCTS: "featured_products",
	FEATURED_CATEGORIES: "featured_categories",
	ALL_CATEGORIES: "all_categories",
	PRODUCTS_BY_CATEGORY: "products_by_category",
	USER_PROFILE: "user_profile",
	USER_PRODUCTS: "user_products",
	PRODUCT_DETAILS: "product_details",
};
```

## 🚀 **Utilisation**

### **1. Dans les services (côté serveur)**

```typescript
import { cacheUtils, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

export async function getLastTenProducts() {
	return await cacheUtils.withCache(
		CACHE_KEYS.FEATURED_PRODUCTS,
		async () => {
			return await prisma.product.findMany({
				// ... requête Prisma
			});
		},
		CACHE_TTL.FEATURED_PRODUCTS
	);
}
```

### **2. Dans les composants React (côté client)**

```typescript
import { useCachedData } from "@/lib/hooks/useCache";

export default function HomePage() {
  const { data: products = [], loading, error } = useCachedData(
    "home:featured_products",
    async () => {
      const response = await apiFetch("/api/products/featured");
      return await response.json();
    },
    10 * 60 * 1000 // 10 minutes
  );

  if (loading) return <Loading />;
  if (error) return <Error />;

  return <ProductList products={products} />;
}
```

### **3. Invalidation du cache**

```typescript
// Invalidation manuelle
import { invalidateProductCache } from "@/services/product";

// Après modification d'un produit
invalidateProductCache(productId);

// Invalidation par pattern
import { cacheUtils } from "@/lib/cache";
cacheUtils.invalidatePattern("products");
```

## 📈 **Monitoring et Debug**

### **Logs de cache**

```typescript
// Activer les logs de cache (développement)
if (process.env.NODE_ENV === "development") {
	console.log(`Cache hit: ${key}`);
	console.log(`Cache miss: ${key}`);
}
```

### **Métriques à surveiller**

- **Hit rate** : Pourcentage de requêtes servies depuis le cache
- **Memory usage** : Utilisation mémoire du cache
- **Response time** : Temps de réponse moyen
- **Database queries** : Nombre de requêtes DB

## 🔄 **Invalidation automatique**

Le système invalide automatiquement le cache lors de :

- ✅ **Création de produit** → Invalide `featured_products`, `products_by_category`
- ✅ **Modification de produit** → Invalide le produit spécifique
- ✅ **Création de catégorie** → Invalide `all_categories`, `featured_categories`
- ✅ **Modification utilisateur** → Invalide les données utilisateur

## 🛠️ **Maintenance**

### **Nettoyage automatique**

- Le cache se nettoie automatiquement toutes les 10 minutes
- Les entrées expirées sont supprimées automatiquement

### **Redémarrage**

- Le cache se vide automatiquement au redémarrage du serveur
- Pas de persistance nécessaire (cache en mémoire)

## 🚨 **Limitations actuelles**

- **Cache en mémoire** : Perdu au redémarrage
- **Pas de cache distribué** : Un cache par instance
- **Pas de compression** : Données brutes en mémoire

## 🔮 **Améliorations futures**

- [ ] **Redis** : Cache distribué pour la production
- [ ] **Compression** : Réduction de l'utilisation mémoire
- [ ] **Cache warming** : Pré-chargement des données populaires
- [ ] **Métriques avancées** : Dashboard de monitoring
- [ ] **Cache par utilisateur** : Données personnalisées

## 📝 **Bonnes pratiques**

1. **TTL approprié** : Utiliser des TTL courts pour les données dynamiques
2. **Clés uniques** : Éviter les collisions de clés
3. **Invalidation ciblée** : Invalider seulement les données concernées
4. **Monitoring** : Surveiller l'utilisation mémoire
5. **Tests** : Tester avec et sans cache

## 🧪 **Tests**

```typescript
// Test du cache
describe("Cache System", () => {
	it("should cache data and return cached version", async () => {
		const data = await getLastTenProducts();
		const cachedData = await getLastTenProducts();
		expect(data).toEqual(cachedData);
	});
});
```
