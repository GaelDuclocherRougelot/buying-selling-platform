# 🔧 Guide de Configuration Stripe

## 🚨 Problème Identifié

**Aucun enregistrement en base de données après paiement** - Les variables d'environnement Stripe ne sont pas configurées.

## 📋 Étapes de Configuration

### 1. **Créer le fichier `.env`**

Copiez le fichier `env.example` vers `.env` :

```bash
cp env.example .env
```

### 2. **Configurer les Clés Stripe**

#### **A. Obtenir vos clés Stripe**

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/)
2. Connectez-vous à votre compte
3. Allez dans **Developers > API keys**
4. Copiez vos clés de test :
    - **Secret key** : `sk_test_...`
    - **Publishable key** : `pk_test_...`

#### **B. Mettre à jour `.env`**

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_ici
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret_ici
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_ici

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. **Configurer le Webhook Stripe**

#### **A. Créer le webhook dans Stripe Dashboard**

1. Allez dans **Developers > Webhooks**
2. Cliquez sur **"Add endpoint"**
3. Configurez :
    - **Endpoint URL** : `https://votre-domaine.com/api/stripe/payments/webhook`
    - **Events to send** :
        - `checkout.session.completed`
        - `payment_intent.succeeded`
        - `payment_intent.payment_failed`

#### **B. Récupérer le secret du webhook**

1. Après création, cliquez sur le webhook
2. Copiez le **Signing secret** (commence par `whsec_`)
3. Ajoutez-le à votre `.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_ici
```

### 4. **Tester la Configuration**

#### **A. Vérifier la configuration**

```bash
node scripts/check-stripe-config.js
```

#### **B. Tester le webhook localement**

Si vous développez en local, utilisez Stripe CLI :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/stripe/payments/webhook
```

### 5. **Tester un Paiement**

#### **A. Créer un produit de test**

1. Allez dans votre application
2. Créez un produit
3. Essayez d'acheter avec une carte de test

#### **B. Cartes de test Stripe**

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **Date** : N'importe quelle date future
- **CVC** : N'importe quels 3 chiffres

## 🔍 Diagnostic

### **Vérifier les Logs**

1. **Logs de l'application** :

    ```bash
    npm run dev
    # Regardez les logs pour "🔔 ===== WEBHOOK RECEIVED ====="
    ```

2. **Logs Stripe** :
    - Allez dans **Developers > Logs**
    - Vérifiez les tentatives de webhook

### **Scripts de Diagnostic**

```bash
# Vérifier la configuration
node scripts/check-stripe-config.js

# Tester le flux de paiement
node scripts/test-payment-flow.js

# Vérifier les webhooks
node scripts/test-webhook.js
```

## 🛠️ Résolution des Problèmes Courants

### **1. Webhook non reçu**

- ✅ Vérifiez l'URL du webhook
- ✅ Vérifiez que le serveur est accessible
- ✅ Vérifiez les logs Stripe

### **2. Signature invalide**

- ✅ Vérifiez `STRIPE_WEBHOOK_SECRET`
- ✅ Assurez-vous que le secret correspond au webhook

### **3. Paiement non créé en base**

- ✅ Vérifiez les métadonnées du paiement
- ✅ Vérifiez la connexion à la base de données
- ✅ Vérifiez les logs du webhook

### **4. Erreur 401 (Unauthorized)**

- ✅ Vérifiez `STRIPE_SECRET_KEY`
- ✅ Assurez-vous que la clé est valide

## 📊 Monitoring

### **Vérifier les Paiements**

```sql
-- Vérifier les paiements récents
SELECT * FROM "Payment" ORDER BY "createdAt" DESC LIMIT 10;

-- Vérifier les paiements par statut
SELECT status, COUNT(*) FROM "Payment" GROUP BY status;
```

### **Vérifier les Webhooks**

- **Stripe Dashboard** > **Developers** > **Webhooks**
- Vérifiez le statut et les tentatives

## 🚀 Déploiement

### **Variables d'Environnement en Production**

Assurez-vous que toutes les variables sont configurées sur votre plateforme de déploiement :

- Vercel : **Settings** > **Environment Variables**
- Netlify : **Site settings** > **Environment variables**
- Autres : Consultez la documentation de votre plateforme

### **URL du Webhook en Production**

Changez l'URL du webhook pour votre domaine de production :

```
https://votre-domaine.com/api/stripe/payments/webhook
```

## ✅ Checklist

- [ ] Fichier `.env` créé avec les bonnes variables
- [ ] Clés Stripe configurées
- [ ] Webhook créé dans Stripe Dashboard
- [ ] Secret du webhook ajouté à `.env`
- [ ] Test de configuration réussi
- [ ] Test de paiement réussi
- [ ] Paiement créé en base de données
- [ ] Webhook reçu et traité

## 🆘 Support

Si vous avez encore des problèmes :

1. Vérifiez les logs de votre application
2. Vérifiez les logs Stripe Dashboard
3. Testez avec les scripts de diagnostic
4. Consultez la [documentation Stripe](https://stripe.com/docs)
