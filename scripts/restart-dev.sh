#!/bin/bash

echo "🚀 Redémarrage Propre de l'Environnement de Développement"
echo "========================================================="

# 1. Nettoyer les caches
echo "1️⃣ Nettoyage des caches..."
./scripts/clean-cache.sh

echo ""
echo "2️⃣ Vérification de l'état de la base de données..."
# Vérifier que Prisma est à jour
npx prisma generate

echo ""
echo "3️⃣ Redémarrage de l'environnement..."
echo "   📱 Application principale..."
pnpm dev &
DEV_PID=$!

# Attendre que l'app soit prête
echo "   ⏳ Attente du démarrage..."
sleep 10

# Démarrer le serveur WebSocket
echo "   🔌 Serveur WebSocket..."
pnpm dev:websocket &
WS_PID=$!

echo ""
echo "✅ Environnement redémarré !"
echo ""
echo "📊 PIDs des processus :"
echo "   - Application principale : $DEV_PID"
echo "   - Serveur WebSocket : $WS_PID"
echo ""
echo "🌐 Application accessible sur : http://localhost:3000"
echo ""
echo "💡 Pour arrêter : pkill -f 'next\|tsx'"
echo "   Ou utilisez : ./scripts/clean-cache.sh"
