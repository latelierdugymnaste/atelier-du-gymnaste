#!/bin/bash

# Script de démarrage pour le développement local
# Définit les variables d'environnement avant de lancer Next.js

export DATABASE_URL="postgresql://neondb_owner:npg_LHE7njdP2Szg@ep-restless-water-agf8jsb3-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="ton-secret-super-securise-123456"

echo "🚀 Démarrage du serveur de développement..."
echo "📊 Variables d'environnement configurées:"
echo "   ✅ DATABASE_URL (DEV)"
echo "   ✅ NEXTAUTH_URL"
echo "   ✅ NEXTAUTH_SECRET"
echo ""

npm run dev
