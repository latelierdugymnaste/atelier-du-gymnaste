# Guide de Sauvegarde et Restauration

## Prérequis

Installer `pg_dump` et `psql` (outils PostgreSQL):

**Sur macOS:**
```bash
brew install postgresql
```

**Sur Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

## Sauvegarde de la base de données de production

### Sauvegarde manuelle

Pour faire une sauvegarde immédiate:

```bash
./scripts/backup-prod.sh
```

Cela va créer un fichier compressé dans le dossier `backups/` avec le format:
`backup_prod_YYYYMMDD_HHMMSS.sql.gz`

### Sauvegarde automatique hebdomadaire

Pour configurer une sauvegarde automatique tous les dimanches à 23h:

**1. Ouvre le crontab:**
```bash
crontab -e
```

**2. Ajoute cette ligne:**
```bash
0 23 * * 0 cd /Users/rossig/development/AtelierDuGymnaste && ./scripts/backup-prod.sh
```

**3. Vérifie que c'est bien configuré:**
```bash
crontab -l
```

## Restauration d'une sauvegarde

### Lister les sauvegardes disponibles

```bash
ls -lh backups/
```

### Restaurer une sauvegarde

```bash
./scripts/restore-backup.sh backups/backup_prod_20241212_143022.sql.gz
```

⚠️ **ATTENTION:** Cette opération va ÉCRASER toutes les données existantes!
Le script va te demander une double confirmation.

## Gestion des sauvegardes

- Les sauvegardes sont automatiquement compressées (.gz)
- Seules les 10 dernières sauvegardes sont conservées
- Les sauvegardes ne sont PAS poussées sur GitHub (dans .gitignore)
- Stocke les sauvegardes importantes sur un service cloud (Google Drive, Dropbox, etc.)

## Alternative: Backups Neon

Neon propose également des backups automatiques dans les plans payants.
Pour activer:
1. Va sur ton tableau de bord Neon
2. Sélectionne ton projet
3. Configure les backups automatiques dans les paramètres

## Copier les données PROD → DEV

Si tu veux synchroniser ta base de dev avec les données de prod:

```bash
# Sauvegarde de prod
./scripts/backup-prod.sh

# Restaurer sur dev (modifie l'URL dans restore-backup.sh)
./scripts/restore-backup.sh backups/backup_prod_[date].sql.gz
```
