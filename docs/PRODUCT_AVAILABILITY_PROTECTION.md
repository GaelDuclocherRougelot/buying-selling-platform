# 🛡️ Protection contre les Achats Multiples

## 🎯 Objectif

Ce système garantit qu'un produit ne peut être acheté que par une seule personne à la fois, évitant les conflits et les litiges.

## 🔒 Mécanismes de Protection

### **1. Vérifications Avant Paiement**

#### **Vérification du Statut du Produit**

```typescript
// Vérifier que le produit n'est pas déjà vendu
if (product.status === "sold") {
	return NextResponse.json(
		{ error: "Ce produit a déjà été vendu" },
		{ status: 400 }
	);
}
```

#### **Vérification des Paiements en Cours**

```typescript
// Vérifier qu'il n'y a pas déjà un paiement en cours
const existingPayment = await prisma.payment.findFirst({
	where: {
		productId: productId,
		status: {
			in: ["pending", "pending_shipping_validation", "succeeded"],
		},
	},
});

if (existingPayment) {
	return NextResponse.json(
		{ error: "Ce produit est en cours d'achat par un autre utilisateur" },
		{ status: 400 }
	);
}
```

#### **Vérification du Propriétaire**

```typescript
// Empêcher l'achat de son propre produit
if (product.ownerId === session.user.id) {
	return NextResponse.json(
		{ error: "Vous ne pouvez pas acheter votre propre produit" },
		{ status: 400 }
	);
}
```

### **2. Points de Contrôle**

#### **Création de Paiement Intent**

- Route : `/api/stripe/payments/create-payment-intent`
- Vérifications : Statut produit, paiements existants, propriétaire

#### **Création de Session Checkout**

- Route : `/api/stripe/checkout/create-session`
- Vérifications : Statut produit, paiements existants, propriétaire

#### **Interface Utilisateur**

- Page produit : Masquage du bouton d'achat si vendu
- Badge de statut : Affichage visuel du statut

## 📊 Statuts de Produit

### **Statuts Disponibles**

- `active` : Produit disponible à l'achat
- `pending` : Produit en attente de validation
- `sold` : Produit vendu (non disponible)

### **Statuts de Paiement**

- `pending` : Paiement créé, en attente
- `pending_shipping_validation` : Paiement réussi, en attente des preuves
- `succeeded` : Paiement validé et transféré
- `refunded` : Paiement remboursé
- `failed` : Paiement échoué

## 🎨 Interface Utilisateur

### **Badge de Statut**

```typescript
<ProductStatusBadge status={product.status} />
```

### **Boutons Conditionnels**

```typescript
{!isOwner && product.status !== "sold" && (
  <PaymentButton productId={product.id} amount={product.price} />
)}

{!isOwner && product.status === "sold" && (
  <Button variant="outline" disabled>
    Produit vendu
  </Button>
)}
```

## 🔄 Flux de Protection

### **1. Tentative d'Achat**

```
Utilisateur clique "Acheter"
↓
Vérification statut produit
↓
Vérification paiements existants
↓
Vérification propriétaire
↓
Création paiement si OK
```

### **2. Gestion des Conflits**

```
Si produit vendu → Message "Déjà vendu"
Si paiement en cours → Message "En cours d'achat"
Si propriétaire → Message "Propre produit"
```

## 🚨 Gestion des Erreurs

### **Messages d'Erreur Utilisateur**

- "Ce produit a déjà été vendu"
- "Ce produit est en cours d'achat par un autre utilisateur"
- "Vous ne pouvez pas acheter votre propre produit"

### **Logs de Debug**

```typescript
console.log(`❌ Tentative d'achat d'un produit vendu: ${productId}`);
console.log(`❌ Conflit de paiement détecté: ${productId}`);
console.log(`❌ Tentative d'achat de son propre produit: ${productId}`);
```

## 🔧 Implémentation Technique

### **Vérifications dans les Routes API**

```typescript
// 1. Vérification statut produit
if (product.status === "sold") {
	return error("Produit vendu");
}

// 2. Vérification paiements existants
const existingPayment = await prisma.payment.findFirst({
	where: {
		productId,
		status: { in: ["pending", "pending_shipping_validation", "succeeded"] },
	},
});

if (existingPayment) {
	return error("Paiement en cours");
}

// 3. Vérification propriétaire
if (product.ownerId === session.user.id) {
	return error("Propre produit");
}
```

### **Protection dans l'Interface**

```typescript
// Masquage conditionnel des boutons
{!isOwner && product.status !== "sold" && (
  <PaymentButton />
)}

// Affichage du statut
<ProductStatusBadge status={product.status} />
```

## 📈 Avantages du Système

### **Pour les Utilisateurs**

- ✅ **Clarté** : Statut du produit visible immédiatement
- ✅ **Sécurité** : Pas de conflit d'achat
- ✅ **Transparence** : Messages d'erreur clairs

### **Pour la Plateforme**

- ✅ **Intégrité** : Un seul acheteur par produit
- ✅ **Traçabilité** : Logs de toutes les tentatives
- ✅ **Performance** : Vérifications rapides en base

### **Pour les Développeurs**

- ✅ **Maintenabilité** : Code modulaire et réutilisable
- ✅ **Testabilité** : Points de contrôle clairs
- ✅ **Évolutivité** : Facile d'ajouter de nouvelles vérifications

## 🔮 Évolutions Futures

### **Phase 1 : Améliorations**

- Notifications en temps réel pour les conflits
- Système de réservation temporaire
- Historique des tentatives d'achat

### **Phase 2 : Automatisation**

- Expiration automatique des paiements en attente
- Nettoyage automatique des conflits
- Système de file d'attente

### **Phase 3 : Intelligence**

- Prédiction des conflits
- Optimisation des temps de réponse
- Système de recommandations

## 🎯 Conclusion

Ce système garantit une expérience utilisateur fluide et sécurisée en :

- Empêchant les achats multiples
- Affichant clairement le statut des produits
- Gérant gracieusement les conflits
- Maintenant l'intégrité de la plateforme
