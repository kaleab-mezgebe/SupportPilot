# PostgreSQL & pgvector Backup and Disaster Recovery Guide

This runbook outlines automated backup, manual backup, and restoration procedures for the SupportPilot PostgreSQL database with `pgvector` knowledge base embeddings.

---

## 1. Backup Strategies Overview

- **Daily Logical Backups (`pg_dump`)**: Stored with gzip compression in custom archive format (`-F c`), capturing all database schemas, tables, sequences, and vector embedding indices.
- **Retention Policy**: Keep daily backups for 14 days, weekly backups for 8 weeks, monthly backups for 1 year.
- **Offsite Replication**: Backup archives must be synced to encrypted object storage (e.g. AWS S3, Google Cloud Storage, or Azure Blob).

---

## 2. Manual Backup Procedure

### Performing a Snapshot Dump from Docker
Run this command from the host where the `supportpilot-postgres-prod` container is running:

```bash
# Set timestamp and backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/supportpilot"
mkdir -p "$BACKUP_DIR"

# Execute pg_dump directly inside the postgres container
docker exec -t supportpilot-postgres-prod pg_dump \
  -U supportpilot \
  -d supportpilot_prod_db \
  -F c \
  -b \
  -v \
  -f "/tmp/supportpilot_${TIMESTAMP}.dump"

# Copy backup archive out of container to host
docker cp "supportpilot-postgres-prod:/tmp/supportpilot_${TIMESTAMP}.dump" "${BACKUP_DIR}/supportpilot_${TIMESTAMP}.dump"

# Remove temporary file inside container
docker exec supportpilot-postgres-prod rm "/tmp/supportpilot_${TIMESTAMP}.dump"

echo "Backup completed successfully: ${BACKUP_DIR}/supportpilot_${TIMESTAMP}.dump"
```

---

## 3. Automated Daily Backup Script (Cron Job)

Create `/usr/local/bin/backup-supportpilot.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/supportpilot"
CONTAINER_NAME="supportpilot-postgres-prod"
DB_USER="supportpilot"
DB_NAME="supportpilot_prod_db"
DATE=$(date +"%Y%m%d_%H%M%S")
FILE_PATH="${BACKUP_DIR}/db_backup_${DATE}.dump"

mkdir -p "${BACKUP_DIR}"

# Run pg_dump
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" -F c -b > "${FILE_PATH}"

# Rotate: remove backups older than 14 days
find "${BACKUP_DIR}" -type f -name "db_backup_*.dump" -mtime +14 -delete

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Backup saved: ${FILE_PATH}"
```

Make it executable:
```bash
chmod +x /usr/local/bin/backup-supportpilot.sh
```

Add to cron (`crontab -e`):
```cron
# Run daily at 02:00 AM UTC
0 2 * * * /usr/local/bin/backup-supportpilot.sh >> /var/log/supportpilot-backup.log 2>&1
```

---

## 4. Database Restoration Procedure

### Warning
Restoring a database will overwrite current tables and records. Ensure the web application is stopped or put in maintenance mode before executing.

### Step 1: Stop API traffic
```bash
docker compose -f docker-compose.prod.yml stop backend frontend
```

### Step 2: Drop existing database connections and restore
```bash
BACKUP_FILE="/var/backups/supportpilot/db_backup_20261012_020000.dump"

# Copy backup file into container
docker cp "${BACKUP_FILE}" supportpilot-postgres-prod:/tmp/restore.dump

# Terminate active client connections and restore
docker exec -it supportpilot-postgres-prod psql -U supportpilot -d postgres -c "
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'supportpilot_prod_db' AND pid <> pg_backend_pid();
"

# Drop and recreate empty database
docker exec -it supportpilot-postgres-prod psql -U supportpilot -d postgres -c "DROP DATABASE IF EXISTS supportpilot_prod_db;"
docker exec -it supportpilot-postgres-prod psql -U supportpilot -d postgres -c "CREATE DATABASE supportpilot_prod_db OWNER supportpilot;"

# Restore using pg_restore
docker exec -it supportpilot-postgres-prod pg_restore \
  -U supportpilot \
  -d supportpilot_prod_db \
  -v \
  /tmp/restore.dump

# Clean up temporary restore file
docker exec supportpilot-postgres-prod rm /tmp/restore.dump
```

### Step 3: Re-verify pgvector Extension and Embeddings
```bash
docker exec -it supportpilot-postgres-prod psql -U supportpilot -d supportpilot_prod_db -c "
SELECT count(*) AS total_articles, count(\"EmbeddingJson\") AS embedded_articles FROM \"KnowledgeArticles\";
"
```

### Step 4: Restart application services
```bash
docker compose -f docker-compose.prod.yml start backend frontend
docker compose -f docker-compose.prod.yml ps
```
