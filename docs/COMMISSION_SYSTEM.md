# 🎯 Système de Commission Progressive

## Vue d'ensemble

Notre plateforme utilise un système de commission progressive qui récompense les vendeurs les plus actifs avec des taux réduits.

## 📊 Paliers de Commission

| Palier      | Ventes réalisées | Commission | Économie |
| ----------- | ---------------- | ---------- | -------- |
| 🥉 Débutant | 0-9 ventes       | **5%**     | -        |
| 🥈 Confirmé | 10-49 ventes     | **4%**     | -1%      |
| 🥇 Expert   | 50+ ventes       | **3%**     | -2%      |

## 💡 Comment ça marche

### 1. **Calcul automatique**

- La commission est calculée automatiquement à chaque transaction
- Basée sur le nombre total de ventes **réussies** du vendeur
- Appliquée immédiatement lors du paiement

### 2. **Évolution en temps réel**

- Votre palier évolue automatiquement avec vos ventes
- Pas de démarche à effectuer
- Visible dans votre tableau de bord vendeur

### 3. **Transparence totale**

- Commission clairement affichée avant chaque vente
- Historique disponible dans votre espace vendeur
- Calcul détaillé dans chaque facture

## 🚀 Avantages

### Pour les vendeurs

- **Motivation** : Plus vous vendez, moins vous payez
- **Fidélisation** : Récompense la fidélité à la plateforme
- **Transparence** : Pas de frais cachés

### Pour les acheteurs

- **Vendeurs motivés** : Des vendeurs plus engagés
- **Meilleur service** : Vendeurs expérimentés privilégiés
- **Prix compétitifs** : Économies répercutées sur les prix

## 🔧 Implémentation technique

### Structure des fichiers

```
src/lib/platform-fees.ts          # Configuration et logique
src/components/platform/           # Composants UI
src/app/api/platform/              # API endpoints
src/lib/hooks/useCommissionInfo.ts # Hook React
```

### Configuration facile

```typescript
// Modifier les paliers dans src/lib/platform-fees.ts
export const VOLUME_DISCOUNTS = [
	{ minSales: 0, maxSales: 9, feePercentage: 0.05 }, // 5%
	{ minSales: 10, maxSales: 49, feePercentage: 0.04 }, // 4%
	{ minSales: 50, maxSales: 999, feePercentage: 0.03 }, // 3%
];
```

## 📈 Exemples de calcul

### Vendeur débutant (2 ventes)

- **Produit** : 100€
- **Commission** : 5% = 5€
- **Vendeur reçoit** : ~92€ (après frais Stripe)

### Vendeur confirmé (25 ventes)

- **Produit** : 100€
- **Commission** : 4% = 4€ ✨ (-1€)
- **Vendeur reçoit** : ~93€

### Vendeur expert (75 ventes)

- **Produit** : 100€
- **Commission** : 3% = 3€ ✨ (-2€)
- **Vendeur reçoit** : ~94€

## 🎉 Impact estimé

### Pour un vendeur qui fait 100 ventes à 100€

- **Commission standard 5%** : 500€ total
- **Avec système progressif** :
    - 0-9 ventes (5%) : 50€
    - 10-49 ventes (4%) : 160€
    - 50-99 ventes (3%) : 150€
    - **Total** : 360€ ✨ **Économie de 140€ !**

## 🔮 Évolutions possibles

1. **Paliers plus granulaires**
2. **Bonus saisonniers**
3. **Commissions par catégorie**
4. **Programme de parrainage**
5. **Commissions négatives pour top vendeurs**

---

_Ce système encourage la croissance tout en maintenant la rentabilité de la plateforme._

