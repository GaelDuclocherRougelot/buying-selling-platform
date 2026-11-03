# SIEM de la plateforme d'achat/vente (Wazuh)

## 1. Objectifs

Détecter en temps réel les attaques ciblant la plateforme, en priorité celles que l'audit de sécurité (ZAP + revue de code, correctifs F5, F7, F8, F11) a identifiées :

| Menace | Correctif lié | Ce que le SIEM ajoute |
|---|---|---|
| Brute force / credential stuffing | rate limit better-auth | Corrélation des échecs par IP, alerte |
| IDOR sur les produits | F7, F8 | Trace de chaque refus, détection d'énumération |
| Déblocage frauduleux des fonds | F5 | Alerte critique sur toute tentative |
| XSS dans le chat | F11 | Trace du payload bloqué |
| Scan automatisé | – | Détection d'une rafale de 401/403 |

Le correctif **empêche** l'attaque, le SIEM la **rend visible** : sans lui, une tentative bloquée ne laisse aucune trace exploitable.

## 2. Architecture

```
Next.js ──securityLog()──► logs/security.json   (1 ligne JSON par événement)
                                │  bind-mount en lecture seule
                                ▼
                    Wazuh manager ── décodeur JSON ── règles 1001xx ── alertes
                                                                         │
                                          Wazuh indexer (OpenSearch) ◄───┘
                                                    │
                                          Wazuh dashboard (Threat Hunting, MITRE ATT&CK)
```

- **Collecte** : `securityLog()` ([src/lib/security-log.ts](../../src/lib/security-log.ts)) est appelée dans les branches de refus des routes API et dans un hook `after` de better-auth ([src/lib/auth.ts](../../src/lib/auth.ts)).
- **Transport** : un fichier local lu par le manager (`<localfile>` au format `json`). Aucun agent n'est nécessaire, puisque le manager et l'app sont sur la même machine.
- **Normalisation** : le décodeur JSON natif de Wazuh, sans décodeur maison. Le champ `srcip` est reconnu nativement, ce qui permet la corrélation par IP.
- **Corrélation et alerte** : les règles de [siem/rules/local_rules.xml](../../siem/rules/local_rules.xml).

## 3. Format des événements

```json
{"ts":"2026-11-03T10:12:00.000Z","app":"buying-selling-platform","siem_event":"authz.denied",
 "srcip":"203.0.113.7","userAgent":"curl/8","userId":"u_123","path":"/api/products/p_42",
 "method":"PUT","resource":"product","resourceId":"p_42"}
```

| `siem_event` | Émis par | Champs spécifiques |
|---|---|---|
| `auth.login_failed` / `auth.login_success` | hook better-auth (`/sign-in/email`, `/sign-in/username`) | `login`, `userId` |
| `authz.unauthenticated` | 401 sur produits et tracking | `path`, `method` |
| `authz.denied` | 403 sur PUT/DELETE produit et sur le tracking | `userId`, `resource`, `resourceId` |
| `payment.release_denied` | 403 sur `/api/payments/[id]/buyer-validation` et `buyer-validate` | `userId`, `isSeller`, `resourceId` |
| `input.xss_blocked` | rejet d'URL d'image non Cloudinary dans le chat | `userId`, `messageType`, `payload` (200 car. max) |

## 4. Règles de détection et mapping MITRE ATT&CK

| ID | Condition | Niveau | MITRE |
|---|---|---|---|
| 100100 | Événement de l'app (règle parente) | 3 | – |
| 100101 | `auth.login_failed` | 5 | T1110 Brute Force |
| 100102 | 5 × 100101 depuis la même IP en 120 s | 10 | T1110.001 Password Guessing |
| 100103 | `auth.login_success` | 3 | – |
| 100110 | `authz.denied` | 6 | T1190 Exploit Public-Facing Application |
| 100111 | 5 × 100110 pour le même `userId` en 300 s | 10 | T1190 (énumération IDOR) |
| 100112 | `authz.unauthenticated` | 4 | – |
| 100120 | `payment.release_denied` | 12 | T1565 Data Manipulation |
| 100130 | `input.xss_blocked` | 8 | T1059.007 JavaScript |
| 100131 | 10 événements du groupe `authz_fail` depuis la même IP en 60 s | 10 | T1595 Active Scanning |

Choix des niveaux : un événement isolé reste ≤ 8 (bruit possible : un utilisateur qui se trompe de mot de passe), une corrélation monte à 10, et la fraude au paiement est à 12 car aucune requête légitime ne la déclenche.

## 5. Mise en œuvre

```bash
siem/setup.sh          # clone wazuh-docker v4.12.0, génère les certificats, branche logs et règles, démarre
pnpm dev               # l'app écrit dans logs/security.json
siem/attack.sh bruteforce
```

Dashboard : https://localhost → *Threat Hunting*, filtre `rule.groups: buying_selling_platform`. Prévoir environ 4 Go de RAM pour Docker. Sur Mac Apple Silicon, les images Wazuh 4.12 sont en amd64 et tournent en émulation : ça fonctionne, mais le démarrage est lent (1 à 2 min).

Pour tester une règle sans relancer l'app :
```bash
docker exec -it single-node-wazuh.manager-1 /var/ossec/bin/wazuh-logtest
```
puis coller une ligne de `logs/security.json`.

## 6. Scénarios de démonstration

| Scénario | Commande | Alerte attendue | Capture |
|---|---|---|---|
| Brute force | `siem/attack.sh bruteforce` | 100102 | *[capture]* |
| IDOR | `COOKIE=… PRODUCT_ID=… siem/attack.sh idor` | 100111 | *[capture]* |
| Fraude paiement | `COOKIE=<vendeur> PAYMENT_ID=… siem/attack.sh fraud` | 100120 | *[capture]* |
| XSS chat | `COOKIE=… CONVERSATION_ID=… siem/attack.sh xss` | 100130 | *[capture]* |
| Scan | `siem/attack.sh scan` (ou un scan ZAP avec `zap.yaml`) | 100131 | *[capture]* |

### Validation : alertes levées (2026-11-03)

Un manager Wazuh 4.12 lit un fichier `security.json` dans lequel on écrit les événements des 5 scénarios, au format produit par `securityLog()`. Les alertes ci-dessous sont extraites de `/var/ossec/logs/alerts/alerts.json`. Les horodatages sont ceux du manager.

| # | Scénario | Horodatage (UTC) | Règle | Niveau | MITRE | Description de l'alerte |
|---|---|---|---|---|---|---|
| 1 | Brute force | 2026-11-03T15:45:11.809 | 100102 | 10 | T1110.001 | brute force - 5 échecs de connexion en 2 min depuis 203.0.113.7 |
| 2 | IDOR | 2026-11-03T15:45:11.809 | 100111 | 10 | T1190 | énumération IDOR - 5 accès refusés en 5 min pour l'utilisateur u_attacker |
| 3 | Fraude au paiement | 2026-11-03T15:45:11.834 | 100120 | 12 | T1565 | tentative de déblocage des fonds du paiement pay1 par un non-acheteur (u_seller, vendeur=true) |
| 4 | XSS dans le chat | 2026-11-03T15:45:11.834 | 100130 | 8 | T1059.007 | payload XSS bloqué dans le chat (utilisateur u_x) |
| 5 | Scan | 2026-11-03T15:45:13.752 | 100131 | 10 | T1595 | scan - 10 refus 401/403 en 1 min depuis 192.0.2.50 |

Les alertes unitaires qui précèdent chaque corrélation ont aussi été levées : 4 × 100101, 4 × 100110 et 9 × 100112. Le dernier événement de chaque série ne produit pas d'alerte unitaire : il déclenche directement la règle de corrélation. Les horodatages sont presque identiques parce que le logcollector a lu le fichier en une seule fois. Lors d'une démo avec `siem/attack.sh`, ils seront étalés.

## 7. Limites

- **Démo en local** : l'IP source vaut `::1` / `127.0.0.1`. Les corrélations par IP marchent, mais il n'y a pas de géolocalisation.
- **Couverture** : seules les routes instrumentées produisent des événements. Une route oubliée est invisible : c'est la limite principale d'un SIEM applicatif.
- **Pas de notification** : les alertes sont consultées dans le dashboard. Wazuh sait envoyer des emails ou appeler un webhook (`<integration>`) si besoin.
- **Données personnelles** : `login` (email) et un extrait du payload sont journalisés. En production il faudrait une durée de rétention définie (RGPD) et éventuellement un hachage de l'email.
- **Intégrité** : le fichier de logs est accessible en écriture par l'app. En production, il faut envoyer les logs hors de la machine dès leur émission.

## 8. Passage en production

L'app est hébergée sur Vercel (fonctions serverless, système de fichiers éphémère). Seul le **transport** change, les règles restent identiques :

1. **Log drain Vercel** (offre Pro) vers un endpoint HTTP, puis un fichier lu par Wazuh sur un VPS.
2. Ou bien `securityLog()` envoie la ligne en HTTPS vers un collecteur (Wazuh manager sur un VPS, via syslog TLS ou une API), à la place de `appendFile`.

Dans les deux cas, le format JSON et les règles 1001xx sont réutilisés tels quels.
