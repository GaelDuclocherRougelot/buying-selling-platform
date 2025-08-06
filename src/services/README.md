# Services

Ce dossier contient les services métier de l'application.

## Service des Commandes (`orders.ts`)

Le service des commandes permet de récupérer et gérer les commandes des utilisateurs.

### Fonctions disponibles

#### `getUserBuyerOrders(userId: string): Promise<Order[]>`

Récupère toutes les commandes d'un utilisateur en tant qu'acheteur.

#### `getUserSellerOrders(userId: string): Promise<Order[]>`

Récupère toutes les commandes d'un utilisateur en tant que vendeur.

#### `getOrderById(orderId: string, userId: string): Promise<Order | null>`

Récupère une commande spécifique par son ID (vérifie que l'utilisateur est l'acheteur ou le vendeur).

#### `getUserOrderStats(userId: string)`

Récupère les statistiques des commandes d'un utilisateur.

### Interface Order

```typescript
interface Order {
	id: string;
	productTitle: string;
	amount: number;
	currency: string;
	status: string;
	createdAt: Date;
	updatedAt: Date;
	product: {
		id: string;
		title: string;
		price: number;
		imageUrl: string;
		category: {
			name: string;
			displayName: string;
		};
	};
	buyer: {
		id: string;
		username: string;
		email: string;
	};
	seller: {
		id: string;
		username: string;
		email: string;
	};
	shipmentTracking?: {
		trackingNumber: string;
		status: string;
		carrier: string;
		lastEventLabel?: string;
		lastEventDate?: Date;
		estimatedDeliveryDate?: Date;
		actualDeliveryDate?: Date;
	};
	shippingProof?: {
		id: string;
		proofUrl: string;
		status: string;
		submittedAt: Date;
	};
}
```

### Statuts de commande

- `pending` : En attente de paiement
- `pending_shipping_validation` : En attente d'expédition
- `succeeded` : Livré et payé
- `failed` : Échec du paiement
- `canceled` : Annulé
- `refunded` : Remboursé

### Utilisation

```typescript
import { getUserBuyerOrders, getUserSellerOrders } from "@/services/orders";

// Récupérer les achats d'un utilisateur
const buyerOrders = await getUserBuyerOrders(userId);

// Récupérer les ventes d'un utilisateur
const sellerOrders = await getUserSellerOrders(userId);
```

## API Routes

### `GET /api/orders`

Récupère les commandes de l'utilisateur connecté.

**Paramètres de requête :**

- `type` : "buyer", "seller", ou "all" (par défaut)
- `stats` : "true" pour inclure les statistiques

**Réponse :**

```json
{
  "buyerOrders": [...],
  "sellerOrders": [...],
  "stats": {
    "totalBuyerOrders": 5,
    "totalSellerOrders": 3,
    "pendingBuyerOrders": 1,
    "pendingSellerOrders": 2
  }
}
```

### `GET /api/orders/[orderId]`

Récupère une commande spécifique.

**Réponse :**

```json
{
  "order": {
    "id": "...",
    "productTitle": "...",
    "amount": 100.00,
    "status": "pending_shipping_validation",
    ...
  }
}
```

## Hooks React

### `useOrders(type?, includeStats?)`

Hook pour récupérer les commandes côté client avec SWR.

```typescript
import { useOrders } from "@/lib/hooks/useOrders";

function MyComponent() {
  const { orders, isLoading, error, mutate } = useOrders("all", true);

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur</div>;

  return (
    <div>
      <h2>Mes Achats ({orders?.buyerOrders?.length || 0})</h2>
      {/* Afficher les commandes */}
    </div>
  );
}
```

### `useOrder(orderId)`

Hook pour récupérer une commande spécifique.

```typescript
import { useOrder } from "@/lib/hooks/useOrders";

function OrderDetail({ orderId }) {
  const { order, isLoading, error } = useOrder(orderId);

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur</div>;

  return (
    <div>
      <h2>{order?.productTitle}</h2>
      <p>Montant: {order?.amount}€</p>
      <p>Statut: {order?.status}</p>
    </div>
  );
}
```

## Composants

### `OrdersList`

Composant pour afficher la liste des commandes avec filtrage.

```typescript
import { OrdersList } from "@/components/orders";

// Afficher toutes les commandes
<OrdersList type="all" />

// Afficher seulement les achats
<OrdersList type="buyer" />

// Afficher seulement les ventes
<OrdersList type="seller" />
```

### `OrdersStats`

Composant pour afficher les statistiques des commandes.

```typescript
import { OrdersStats } from "@/components/orders";

<OrdersStats />
```

## Exemple complet

```typescript
import { OrdersList, OrdersStats } from "@/components/orders";

export default function OrdersPage() {
  return (
    <div>
      <h1>Mes Commandes</h1>
      <OrdersStats />
      <OrdersList type="all" />
    </div>
  );
}
```
