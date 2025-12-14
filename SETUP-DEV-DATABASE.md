# Guide: Configurer la base de données de développement

## 📋 Contexte

Tu vas créer une deuxième base de données Neon pour le développement local. Cela te permettra de:
- ✅ Tester en local sans risque d'affecter la production
- ✅ Modifier l'application en toute sécurité
- ✅ Garder les données de production intactes

## 🚀 Étapes à suivre

### Étape 1: Créer une nouvelle base de données sur Neon

1. Va sur https://console.neon.tech
2. Connecte-toi avec ton compte
3. Clique sur **"Create a new project"** ou **"New Project"**
4. Configure le projet:
   - **Name**: `atelier-du-gymnaste-dev` (ou un nom similaire)
   - **Region**: Même région que ta base de prod (pour de meilleures performances)
   - **PostgreSQL version**: 17 (la même que ta base de prod)
5. Clique sur **"Create Project"**

### Étape 2: Copier la connection string

1. Une fois le projet créé, tu verras une **Connection String**
2. Elle ressemble à:
   ```
   postgresql://[username]:[password]@[host].neon.tech/neondb?sslmode=require
   ```
3. **COPIE cette URL complète**

### Étape 3: Configurer .env.local

1. Ouvre le fichier `.env.local` (dans la racine du projet)
2. Remplace la ligne `DATABASE_URL="postgresql://CHANGE_ME:..."` par ta nouvelle URL
3. Exemple:
   ```
   DATABASE_URL="postgresql://neondb_owner_dev:abc123@ep-cool-snowflake-123456.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```
4. Sauvegarde le fichier

### Étape 4: Créer les tables dans la nouvelle base de données

Exécute ces commandes dans ton terminal:

```bash
# Créer les tables dans la base de dev
npx prisma db push

# Créer un user admin pour te connecter
npx tsx prisma/seed.ts
```

### Étape 5: (Optionnel) Copier les données de production

Si tu veux avoir les mêmes données qu'en production dans ta base de dev:

```bash
# Utilise la dernière sauvegarde
# Modifie le script restore-backup.sh pour pointer vers la base de DEV
./scripts/restore-backup.sh backups/backup_prod_[date].sql.gz
```

### Étape 6: Tester que tout fonctionne

```bash
# Démarre l'application en local
npm run dev

# Ouvre http://localhost:3000
# Connecte-toi avec: admin@atelier.com / admin123
```

## ✅ Vérification

Pour vérifier quelle base de données tu utilises:

**En local:**
- Next.js lit `.env.local` en priorité → Base de DEV

**Sur Vercel (production):**
- Vercel utilise ses variables d'environnement → Base de PROD

## 🔐 Sécurité

- ✅ `.env.local` est déjà dans `.gitignore`
- ✅ Il ne sera JAMAIS poussé sur GitHub
- ✅ Tes credentials restent secrets

## 📝 Résumé de ce qui a été configuré

```
┌─────────────────────────────────────┐
│  ENVIRONNEMENT LOCAL                │
│  Lit: .env.local                    │
│  → Base de données: DEV (Neon)      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ENVIRONNEMENT PRODUCTION (Vercel)  │
│  Lit: Variables d'environnement     │
│  → Base de données: PROD (Neon)     │
└─────────────────────────────────────┘
```

## 🆘 Besoin d'aide?

Si tu as un problème:
1. Vérifie que la DATABASE_URL dans `.env.local` est correcte
2. Vérifie que tu as bien exécuté `npx prisma db push`
3. Vérifie que le user admin a été créé avec `npx tsx prisma/seed.ts`
