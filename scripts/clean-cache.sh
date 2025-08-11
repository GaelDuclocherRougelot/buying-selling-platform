#!/bin/bash

echo "🧹 Nettoyage Complet des Caches Next.js"
echo "========================================"

# Arrêter tous les processus Next.js
echo "1️⃣ Arrêt des processus Next.js..."
pkill -f "next-server" 2>/dev/null || echo "   ✅ Aucun processus next-server trouvé"
pkill -f "tsx" 2>/dev/null || echo "   ✅ Aucun processus tsx trouvé"
pkill -f "pnpm dev" 2>/dev/null || echo "   ✅ Aucun processus pnpm dev trouvé"

# Attendre que les processus se terminent
sleep 2

# Nettoyer les dossiers de cache
echo "2️⃣ Suppression des dossiers de cache..."
rm -rf .next 2>/dev/null && echo "   ✅ Dossier .next supprimé" || echo "   ❌ Erreur suppression .next"
rm -rf node_modules/.cache 2>/dev/null && echo "   ✅ Cache node_modules supprimé" || echo "   ❌ Erreur suppression cache"

# Nettoyer les logs et fichiers temporaires
echo "3️⃣ Nettoyage des fichiers temporaires..."
find . -name "*.log" -delete 2>/dev/null && echo "   ✅ Fichiers .log supprimés"
find . -name ".DS_Store" -delete 2>/dev/null && echo "   ✅ Fichiers .DS_Store supprimés"

# Vérifier qu'aucun processus ne tourne
echo "4️⃣ Vérification finale..."
if pgrep -f "next\|tsx" > /dev/null; then
    echo "   ⚠️  Certains processus sont encore actifs, forçons l'arrêt..."
    pkill -9 -f "next\|tsx" 2>/dev/null
    sleep 1
fi

# Vérification finale
if pgrep -f "next\|tsx" > /dev/null; then
    echo "   ❌ Impossible d'arrêter tous les processus"
else
    echo "   ✅ Tous les processus sont arrêtés"
fi

echo ""
echo "🎉 Nettoyage terminé !"
echo ""
echo "📋 Pour redémarrer proprement :"
echo "   pnpm dev"
echo ""
echo "💡 Conseil : Utilisez ce script avant de tester des corrections importantes"
