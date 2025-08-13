# 💳 Analyse du Système de Paiement

## 🔍 Problèmes Identifiés

### 1. **Webhook Incomplet**

- Le webhook ne crée pas de paiements dans la base de données pour les `payment_intent.succeeded` sans session de checkout
- Logique incohérente dans `handlePaymentIntentSucceeded`

### 2. **Deux Systèmes Parallèles**

- **Stripe Checkout Sessions** (utilisé par `PaymentButton.tsx`)
- **Stripe Payment Intents** (utilisé par `create-payment-intent/route.ts`)
- Le webhook ne gère que les sessions de checkout

### 3. **Gestion des Métadonnées**

- Les métadonnées peuvent être manquantes dans certains cas
- Pas de fallback pour créer les paiements sans métadonnées complètes

## 🛠️ Solutions Implémentées

### 1. **Correction du Webhook**

```typescript
// Dans handlePaymentIntentSucceeded
if (!existingPayment) {
	// Créer un nouveau paiement avec les métadonnées du payment intent
	const { productId, buyerId, sellerId } = paymentIntent.metadata || {};

	if (productId && buyerId && sellerId) {
		await prisma.payment.create({
			data: {
				stripePaymentIntentId: paymentIntent.id,
				amount: paymentIntent.amount / 100,
				currency: paymentIntent.currency,
				status: "pending_shipping_validation",
				productId: productId,
				buyerId: buyerId,
				sellerId: sellerId,
			},
		});
	}
}
```

### 2. **Scripts de Diagnostic**

- `test-payments.js` : Vérification des paiements existants
- `test-payment-flow.js` : Test du flux complet
- `test-webhook.js` : Test du webhook Stripe
- `fix-payment-issues.js` : Correction automatique des problèmes

## 🔄 Flux de Paiement Corrigé

### **Stripe Checkout Sessions (Principal)**

```
1. Utilisateur clique "Acheter"
2. Création de session checkout (/api/stripe/checkout/create-session)
3. Paiement créé en base avec payment_intent
4. Redirection vers Stripe Checkout
5. Webhook checkout.session.completed
6. Mise à jour du paiement en base
7. Produit marqué comme vendu
```

### **Stripe Payment Intents (Fallback)**

```
1. Création de payment intent (/api/stripe/payments/create-payment-intent)
2. Paiement créé en base
3. Webhook payment_intent.succeeded
4. Mise à jour du paiement en base
5. Statut "pending_shipping_validation"
```

## 📊 Statuts de Paiement

- `pending` : Paiement créé, en attente
- `pending_shipping_validation` : Paiement réussi, en attente des preuves
- `succeeded` : Preuves validées, paiement transféré
- `failed` : Paiement échoué
- `canceled` : Paiement annulé
- `refunded` : Paiement remboursé

## 🧪 Tests Recommandés

### 1. **Test du Flux Principal**

```bash
node test-payment-flow.js
```

### 2. **Test du Webhook**

```bash
node test-webhook.js
```

### 3. **Correction des Problèmes**

```bash
node fix-payment-issues.js
```

## 🔧 Configuration Requise

### **Variables d'Environnement**

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Webhook Stripe**

- URL: `https://votre-domaine.com/api/stripe/payments/webhook`
- Événements: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

## 🚨 Points d'Attention

### 1. **Métadonnées Obligatoires**

- `productId` : ID du produit
- `buyerId` : ID de l'acheteur
- `sellerId` : ID du vendeur

### 2. **Gestion des Erreurs**

- Logs détaillés dans le webhook
- Fallback pour les paiements sans métadonnées
- Nettoyage automatique des paiements orphelins

### 3. **Sécurité**

- Vérification des signatures Stripe
- Validation des métadonnées
- Protection contre les paiements multiples

## 📈 Monitoring

### **Métriques à Surveiller**

- Nombre de paiements créés vs réussis
- Temps de traitement des webhooks
- Taux d'erreur des paiements
- Cohérence des statuts produit/paiement

### **Logs Importants**

```typescript
console.log(`📝 Paiement créé: ${paymentIntent.id}`);
console.log(`📝 Paiement mis à jour: ${paymentIntent.id}`);
console.log(`⚠️ Métadonnées manquantes: ${paymentIntent.id}`);
```

## ✅ Validation

Après les corrections, le système devrait :

1. ✅ Créer des paiements pour tous les événements Stripe
2. ✅ Maintenir la cohérence entre produits et paiements
3. ✅ Gérer les deux types de paiement (checkout et payment intent)
4. ✅ Nettoyer automatiquement les données orphelines
5. ✅ Fournir des logs détaillés pour le debugging
