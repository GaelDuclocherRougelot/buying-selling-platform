#!/usr/bin/env bash
# Installe Wazuh single-node (Docker) et y branche les logs de la plateforme.
set -euo pipefail
cd "$(dirname "$0")"

WAZUH_VERSION="v4.12.0"
DIR="wazuh-docker/single-node"

if [ ! -d wazuh-docker ]; then
  git clone --depth 1 --branch "$WAZUH_VERSION" https://github.com/wazuh/wazuh-docker.git
fi

# Certificats TLS de l'indexer (une seule fois)
if [ ! -f "$DIR/config/wazuh_indexer_ssl_certs/root-ca.pem" ]; then
  docker compose -f "$DIR/generate-indexer-certs.yml" run --rm generator
fi

# Lecture du fichier de logs de l'app (idempotent)
if ! grep -q "/var/log/app/security.json" "$DIR/config/wazuh_cluster/wazuh_manager.conf"; then
  cat config/localfile.conf >> "$DIR/config/wazuh_cluster/wazuh_manager.conf"
fi

cp docker-compose.override.yml "$DIR/"
mkdir -p ../logs && touch ../logs/security.json

(cd "$DIR" && docker compose up -d)
echo "Dashboard : https://localhost (admin / SecretPassword par défaut, voir $DIR/docker-compose.yml)"
