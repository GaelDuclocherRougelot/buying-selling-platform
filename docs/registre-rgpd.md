# Registre des activités de traitement — ZONE

Registre tenu au titre de l'article 30 du RGPD. Établi à partir du code et du schéma de données de l'application (état de `main` au 12/11/2026).

Les mentions **[à compléter]** et **[à confirmer]** ne peuvent pas être déduites du code : elles doivent être renseignées par le responsable du traitement.

## 1. Acteurs

| Rôle | Identité |
| --- | --- |
| Responsable du traitement | Gaël Duclocher-Rougelot — gaelduclocher.rougelot@gmail.com — adresse postale **[à compléter]** |
| Délégué à la protection des données | Non désigné (désignation non obligatoire : pas de suivi à grande échelle ni de données sensibles) |
| Contact pour l'exercice des droits | gaelduclocher.rougelot@gmail.com — réponse sous 30 jours |

## 2. Sous-traitants et destinataires

| Prestataire | Rôle | Données concernées | Localisation / transfert hors UE |
| --- | --- | --- | --- |
| Vercel | Hébergement de l'application, journaux d'exécution | Toutes les données en transit, adresses IP | Société américaine — région d'exécution **[à confirmer]** |
| Neon | Base de données PostgreSQL | Toutes les données stockées | Société américaine — région de la base **[à confirmer]** |
| Stripe | Paiement (Checkout) et comptes vendeurs (Connect) | Identité et coordonnées bancaires des vendeurs, données de carte des acheteurs, montants | Stripe Payments Europe (Irlande) ; transferts vers les États-Unis encadrés par Stripe |
| Cloudinary | Stockage des images | Photos de profil, photos d'annonces, preuves d'expédition | Hors UE **[à confirmer]** |
| Resend | Envoi des emails transactionnels | Adresse email, contenu des emails (liens d'inscription, de vérification, de réinitialisation, messages de contact) | États-Unis **[à confirmer]** |
| PostHog (instance EU) | Mesure d'audience et replay de session, après consentement | Identifiant utilisateur, événements de navigation, enregistrements d'écran masqués | Union européenne |
| Google | Connexion « Se connecter avec Google » | Nom, email, photo de profil, jetons OAuth | Google Ireland ; transferts possibles vers les États-Unis |
| Geoapify | Autocomplétion de la ville lors de la publication | Texte saisi dans le champ ville | Allemagne **[à confirmer]** |
| Wazuh (SIEM auto-hébergé) | Détection d'incidents de sécurité | Journaux de sécurité (IP, identifiant de connexion) | Infrastructure du responsable **[à confirmer]** |

Aucune donnée n'est vendue ni cédée à des tiers.

## 3. Traitements

### T1 — Gestion des comptes utilisateurs

| | |
| --- | --- |
| Finalité | Création du compte, authentification, gestion du profil, vérification de l'adresse email |
| Base légale | Exécution du contrat (CGU) |
| Personnes concernées | Utilisateurs inscrits |
| Données | Nom, pseudo, email, mot de passe haché, photo de profil, rôle, identifiant et jetons Google, sessions (jeton, IP, navigateur), inscription en attente (payload chiffré AES-256-GCM, 1 h) |
| Destinataires | Responsable, staff (`admin`, `moderator`), Neon, Vercel, Resend, Google, Cloudinary |
| Conservation | Durée de vie du compte, puis 12 mois après la demande de suppression (suppression douce `deletedAt`) |

### T2 — Publication et consultation des annonces

| | |
| --- | --- |
| Finalité | Publier, modérer et afficher les annonces ; gérer les favoris |
| Base légale | Exécution du contrat |
| Personnes concernées | Vendeurs, utilisateurs inscrits |
| Données | Titre, description, prix, photos, ville, mode de livraison, favoris |
| Destinataires | Public (annonces), staff, Neon, Vercel, Cloudinary, Geoapify |
| Conservation | Durée de vie de l'annonce ; supprimée avec le compte |

### T3 — Messagerie et offres entre utilisateurs

| | |
| --- | --- |
| Finalité | Mise en relation acheteur/vendeur, négociation du prix |
| Base légale | Exécution du contrat |
| Personnes concernées | Acheteurs et vendeurs |
| Données | Contenu des messages, offres (montant, statut, dates) |
| Destinataires | Les deux participants de la conversation, Neon, Vercel |
| Conservation | Durée de vie des comptes participants (suppression en cascade) — **aucune purge automatique** |

### T4 — Paiements et transactions

| | |
| --- | --- |
| Finalité | Encaisser l'acheteur, bloquer les fonds jusqu'à validation, reverser le vendeur, prélever la commission |
| Base légale | Exécution du contrat ; obligation légale (comptabilité, lutte contre la fraude et le blanchiment côté Stripe) |
| Personnes concernées | Acheteurs et vendeurs |
| Données | Identifiants acheteur/vendeur, montant, commission, identifiant de paiement Stripe, statut ; identifiant et statut du compte Stripe Connect. Les données de carte et les justificatifs d'identité des vendeurs sont collectés et conservés par Stripe, jamais par ZONE |
| Destinataires | Responsable, staff, Stripe, Neon, Vercel |
| Conservation | 10 ans pour les pièces comptables (art. L123-22 du Code de commerce) — la politique de confidentialité annonce 5 ans |

### T5 — Expédition et validation de la livraison

| | |
| --- | --- |
| Finalité | Prouver l'expédition, suivre le colis, valider la réception avant de libérer les fonds |
| Base légale | Exécution du contrat |
| Personnes concernées | Acheteurs et vendeurs |
| Données | Numéro de suivi, transporteur, événements de livraison, preuve d'expédition (photos, données déclarées), pesée du colis (poids, identifiant de la balance), décision du staff |
| Destinataires | Acheteur, vendeur, staff, Neon, Vercel, Cloudinary |
| Conservation | Liée au paiement (voir T4) |

### T6 — Sécurité et journalisation

| | |
| --- | --- |
| Finalité | Détecter les connexions frauduleuses et les attaques, diagnostiquer les erreurs |
| Base légale | Intérêt légitime (sécurité du service) |
| Personnes concernées | Utilisateurs inscrits, visiteurs |
| Données | Journaux de connexion (IP, navigateur, localisation, succès/échec), journaux d'erreurs (IP, navigateur, chemin, identifiant utilisateur), journal de sécurité `logs/security.json` (IP, navigateur, identifiant de connexion saisi, refus d'accès) |
| Destinataires | Responsable, staff, Neon, Vercel, SIEM Wazuh |
| Conservation | Journaux de connexion : 90 jours (purge automatique). Journaux d'erreurs et journal de sécurité : **durée non définie** |

### T7 — Mesure d'audience et analyse d'usage

| | |
| --- | --- |
| Finalité | Comprendre l'usage du site pour l'améliorer |
| Base légale | Consentement (bandeau cookies, refus par défaut, retrait possible via « Gérer les cookies ») |
| Personnes concernées | Visiteurs et utilisateurs ayant accepté |
| Données | Identifiant utilisateur (aucun email ni nom), pages vues, événements typés (recherche, annonce vue, paiement démarré…), replay de session avec champs masqués ; messagerie et paiement exclus de la capture |
| Destinataires | Responsable, PostHog (UE) |
| Conservation | Choix de consentement : 13 mois (cookie `zone_analytics_consent`). Données PostHog : durée du projet PostHog **[à confirmer]** |

### T8 — Formulaire de contact

| | |
| --- | --- |
| Finalité | Répondre aux demandes |
| Base légale | Intérêt légitime (répondre à la personne qui écrit) |
| Personnes concernées | Toute personne utilisant le formulaire |
| Données | Nom, email, contenu du message |
| Destinataires | Responsable, Resend, messagerie du responsable |
| Conservation | Non stocké en base ; conservé dans la boîte mail du responsable **[durée à définir]** |

### T9 — Exercice des droits

| | |
| --- | --- |
| Finalité | Répondre aux demandes d'accès, de portabilité, de rectification et d'effacement |
| Base légale | Obligation légale (RGPD, art. 15 à 21) |
| Personnes concernées | Utilisateurs inscrits |
| Données | Export JSON des données du compte, date de la demande de suppression |
| Destinataires | La personne concernée, responsable |
| Conservation | Suppression définitive 12 mois après la demande |

## 4. Mesures de sécurité

- Chiffrement en transit (HTTPS) ; mots de passe hachés par better-auth ; payload d'inscription chiffré en AES-256-GCM.
- Contrôle d'accès par rôle (`admin`, `moderator`) et vérification de propriété dans les routes qui modifient une ressource.
- Politique de sécurité du contenu (CSP) avec nonce ; aucun secret côté client.
- Limitation du débit sur les routes d'authentification.
- Journal de sécurité exploité par un SIEM (Wazuh) : échecs de connexion, refus d'accès.
- Paiement délégué à Stripe : aucune donnée de carte ne transite par les serveurs de ZONE.
- Analytics en opt-out tant que le consentement n'est pas donné ; zones sensibles exclues du replay.
- Sauvegardes de la base (scripts `backup:*`).

## 5. Historique

| Date | Modification |
| --- | --- |
| 12/11/2026 | Création du registre |
