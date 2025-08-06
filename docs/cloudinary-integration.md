# Intégration Cloudinary pour les Preuves d'Expédition

## Vue d'ensemble

Le système utilise Cloudinary pour stocker de manière sécurisée les photos de preuves d'expédition dans le dossier `proof-pictures`.

## Architecture

### **📁 Structure des dossiers Cloudinary :**

```
cloudinary.com/your-cloud-name/
├── proof-pictures/
│   ├── receipt_[timestamp]_[paymentId].jpg
│   ├── package_[timestamp]_[paymentId].jpg
│   └── ...
├── profile-pictures/
└── product-images/
```

### **🔄 Flux d'upload :**

1. **Vendeur sélectionne les photos** (reçu + colis)
2. **Upload automatique** vers Cloudinary dossier `proof-pictures`
3. **URLs sécurisées** récupérées et stockées en base
4. **Preuve soumise** avec les URLs Cloudinary

## Configuration

### **Variables d'environnement requises :**

```env
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_PRESET_NAME=your_upload_preset
```

### **Upload Preset Cloudinary :**

- **Nom :** `proof-pictures`
- **Signing Mode :** `unsigned`
- **Folder :** `proof-pictures`
- **Transformations :** Optimisation automatique des images

## API Endpoints

### **POST /api/upload/proof-pictures**

```typescript
// Request
FormData {
  files: File[] // Images à uploader
}

// Response
{
  urls: string[] // URLs Cloudinary sécurisées
}
```

### **Exemple d'utilisation :**

```typescript
const uploadImageToCloudinary = async (
	file: File,
	type: "receipt" | "package"
) => {
	const formData = new FormData();
	formData.append("files", file);

	const response = await fetch("/api/upload/proof-pictures", {
		method: "POST",
		body: formData,
	});

	const data = await response.json();
	return data.urls[0]; // URL Cloudinary
};
```

## Sécurité

### **1. Validation des fichiers :**

- **Types acceptés :** JPEG, PNG, GIF
- **Taille maximale :** 10MB par fichier
- **Authentification :** Utilisateur connecté requis

### **2. Organisation sécurisée :**

- **Dossier dédié :** `proof-pictures` isolé
- **Noms uniques :** Timestamp + PaymentId
- **Accès contrôlé :** URLs sécurisées uniquement

### **3. Protection des données :**

- **Pas de stockage local** des images sensibles
- **URLs temporaires** avec expiration possible
- **Suppression automatique** en cas de rejet

## Fonctionnalités

### **1. Upload automatique :**

```typescript
// Dans ShippingProofForm.tsx
const [uploadProgress, setUploadProgress] = useState({
	receipt: false,
	package: false,
});

// Upload en parallèle
const [receiptImageUrl, packageImageUrl] = await Promise.all([
	uploadImageToCloudinary(receiptImage, "receipt"),
	uploadImageToCloudinary(packageImage, "package"),
]);
```

### **2. Indicateurs de progression :**

- **Upload en cours** : Indicateur visuel
- **Erreurs d'upload** : Messages explicites
- **Validation** : Vérification des types et tailles

### **3. Gestion des erreurs :**

```typescript
try {
	const imageUrl = await uploadImageToCloudinary(file, type);
	// Succès
} catch (error) {
	setError("Erreur lors de l'upload de l'image");
	// Gestion de l'erreur
}
```

## Stockage en base de données

### **Modèle ShippingProof :**

```typescript
interface ShippingProof {
	id: string;
	paymentId: string;
	proofType: "complete_proof";
	proofData: {
		trackingNumber: string;
		receiptImageUrl: string; // URL Cloudinary
		packageImageUrl: string; // URL Cloudinary
		description?: string;
		submittedAt: string;
	};
	status: "pending" | "verified" | "rejected";
	submittedAt: DateTime;
	verifiedAt?: DateTime;
}
```

### **Exemple de données :**

```json
{
	"id": "proof_123",
	"paymentId": "payment_456",
	"proofType": "complete_proof",
	"proofData": {
		"trackingNumber": "1A2B3C4D5E6F",
		"receiptImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123/proof-pictures/receipt_1234567890_payment_456.jpg",
		"packageImageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v123/proof-pictures/package_1234567890_payment_456.jpg",
		"description": "Colis emballé avec soin",
		"submittedAt": "2024-01-15T10:30:00Z"
	},
	"status": "pending",
	"submittedAt": "2024-01-15T10:30:00Z"
}
```

## Avantages

### **1. Performance optimisée :**

- **CDN global** : Images servies rapidement partout
- **Optimisation automatique** : Redimensionnement et compression
- **Cache intelligent** : Réduction des temps de chargement

### **2. Sécurité renforcée :**

- **Pas de stockage local** des images sensibles
- **URLs sécurisées** avec authentification
- **Isolation des dossiers** par type de contenu

### **3. Scalabilité :**

- **Stockage illimité** : Pas de limite de taille
- **Gestion automatique** : Pas de maintenance serveur
- **Backup automatique** : Redondance Cloudinary

### **4. Conformité :**

- **RGPD compatible** : Suppression facile des données
- **Audit trail** : Traçabilité complète des uploads
- **Sécurité certifiée** : Standards Cloudinary

## Monitoring

### **Métriques suivies :**

- **Taux de succès** des uploads
- **Temps de réponse** moyen
- **Taille moyenne** des fichiers
- **Erreurs d'upload** par type

### **Alertes automatiques :**

- **Échecs d'upload** répétés
- **Fichiers trop volumineux**
- **Types de fichiers non autorisés**
- **Problèmes de connectivité** Cloudinary

## Évolutions futures

### **1. Transformations avancées :**

```typescript
// Watermark automatique
const transformations = {
	watermark: "proof_verified",
	overlay: "text:Preuve vérifiée",
};

// Redimensionnement intelligent
const responsiveImages = {
	width: "auto",
	height: "auto",
	crop: "fill",
};
```

### **2. IA et analyse :**

- **Détection automatique** de contenu inapproprié
- **OCR** pour extraire les données des reçus
- **Validation automatique** des images

### **3. Intégrations avancées :**

- **Webhooks** pour notifications en temps réel
- **API de suppression** automatique
- **Métadonnées** enrichies

## Utilisation dans le système

### **1. Pour les vendeurs :**

```typescript
// Upload automatique lors de la soumission
const proofData = {
	trackingNumber: "1A2B3C4D5E6F",
	receiptImageUrl: await uploadImageToCloudinary(receiptFile, "receipt"),
	packageImageUrl: await uploadImageToCloudinary(packageFile, "package"),
	description: "Colis emballé avec soin",
};
```

### **2. Pour les admins :**

```typescript
// Vérification des preuves
const verifyProof = async (proofId: string) => {
	const proof = await getProof(proofId);

	// Accès direct aux images Cloudinary
	const receiptImage = proof.proofData.receiptImageUrl;
	const packageImage = proof.proofData.packageImageUrl;

	// Interface de vérification
	return verifyImages(receiptImage, packageImage);
};
```

### **3. Pour les acheteurs :**

```typescript
// Affichage sécurisé des preuves (si autorisé)
const displayProof = (proof: ShippingProof) => {
  if (proof.status === "verified") {
    return (
      <div>
        <img src={proof.proofData.receiptImageUrl} alt="Reçu" />
        <img src={proof.proofData.packageImageUrl} alt="Colis" />
      </div>
    );
  }
};
```

Cette intégration Cloudinary offre une solution robuste et sécurisée pour le stockage des preuves d'expédition ! 🚀
