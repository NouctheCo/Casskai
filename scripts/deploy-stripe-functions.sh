#!/bin/bash

# Script de déploiement des fonctions Supabase Edge pour les abonnements Stripe

echo "🚀 Déploiement des fonctions Supabase Edge..."

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé. Installez-le avec : npm install -g supabase"
    exit 1
fi

# Vérifier si on est connecté à Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Supabase. Connectez-vous avec : supabase login"
    exit 1
fi

echo "📦 Déploiement de create-checkout-session..."
supabase functions deploy create-checkout-session

echo "📦 Déploiement de create-portal-session..."
supabase functions deploy create-portal-session

echo "📦 Déploiement de update-subscription..."
supabase functions deploy update-subscription

echo "📦 Déploiement de cancel-subscription..."
supabase functions deploy cancel-subscription

echo "📦 Déploiement de reactivate-subscription..."
supabase functions deploy reactivate-subscription

echo "✅ Toutes les fonctions ont été déployées avec succès !"

echo ""
echo "🔧 Pensez à configurer les variables d'environnement dans Supabase :"
echo "   - STRIPE_SECRET_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "🔗 Configurez aussi le webhook Stripe vers :"
echo "   https://your-project.supabase.co/functions/v1/stripe-webhook"
