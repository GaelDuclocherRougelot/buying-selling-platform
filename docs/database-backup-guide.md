# Database Backup Guide

This guide covers all aspects of backing up and restoring your PostgreSQL database for the buying-selling platform.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Manual Backup Commands](#manual-backup-commands)
4. [Automated Backups](#automated-backups)
5. [Restore Operations](#restore-operations)
6. [Backup Strategies](#backup-strategies)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)

## Overview

Your project uses PostgreSQL with Prisma ORM. The backup system provides:

- **Full backups** - Complete database dumps
- **Schema-only backups** - Database structure without data
- **Data-only backups** - Data without structure
- **Table-specific backups** - Individual table backups
- **Automated scheduling** - Cron-based backup automation
- **Backup rotation** - Automatic cleanup of old backups
- **Restore capabilities** - Full restore functionality

## Prerequisites

### 1. Install PostgreSQL Client Tools

**macOS:**

```bash
brew install postgresql
```

**Ubuntu/Debian:**

```bash
sudo apt-get install postgresql-client
```

**Windows:**
Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Environment Variables

Ensure these are set in your `.env` file:

```bash
# Database connection
DATABASE_URL="postgresql://username:password@host:port/database"

# Backup configuration (optional)
BACKUP_DIR="./backups"
WEBHOOK_URL="https://your-webhook-url.com"  # For notifications
```

### 3. Verify Connection

Test your database connection:

```bash
npm run restore:test
```

## Manual Backup Commands

### Full Backup (Recommended)

Creates a complete backup with compression:

```bash
npm run backup:full
```

**Output:** `full-backup-2024-01-15.backup`

### Schema-Only Backup

Backs up database structure without data:

```bash
npm run backup:schema
```

**Output:** `schema-only-2024-01-15.sql`

### Data-Only Backup

Backs up data without structure:

```bash
npm run backup:data
```

**Output:** `data-only-2024-01-15.sql`

### Table-Specific Backup

Back up specific tables:

```bash
npm run backup:tables "users,products"
```

**Output:** `tables-users-products-2024-01-15.sql`

### List Available Backups

View all backup files:

```bash
npm run backup:list
```

### Cleanup Old Backups

Remove backups older than 30 days:

```bash
npm run backup:cleanup
```

Or specify custom retention:

```bash
npm run backup:cleanup 60  # 60 days
```

## Automated Backups

### Daily Backup

Runs a full backup with 30-day retention:

```bash
npm run backup:auto:daily
```

### Weekly Backup

Runs a full backup with 90-day retention:

```bash
npm run backup:auto:weekly
```

### Monthly Backup

Runs a full backup with 365-day retention:

```bash
npm run backup:auto:monthly
```

### Schema Backup

Runs schema-only backup with 30-day retention:

```bash
npm run backup:auto:schema
```

### Table Backup

Back up specific tables with 7-day retention:

```bash
npm run backup:auto:tables "users,products,payments"
```

### Backup Statistics

View backup statistics:

```bash
npm run backup:auto:stats
```

## Restore Operations

### List Available Backups for Restore

```bash
npm run restore:list
```

### Test Database Connection

```bash
npm run restore:test
```

### Full Restore

Restore from a full backup:

```bash
npm run restore:full "full-backup-2024-01-15.backup"
```

### Schema-Only Restore

Restore only database structure:

```bash
npm run restore:schema "schema-only-2024-01-15.sql"
```

### Data-Only Restore

Restore only data:

```bash
npm run restore:data "data-only-2024-01-15.sql"
```

### Table-Specific Restore

Restore specific tables:

```bash
npm run restore:tables "backup.sql" "users,products"
```

### Create New Database

```bash
npm run restore:create-db "new_database_name"
```

### Drop Database

```bash
npm run restore:drop-db "database_name"
```

## Backup Strategies

### 1. Development Environment

**Frequency:** Before major changes
**Type:** Full backup
**Retention:** 7 days

```bash
# Before schema changes
npm run backup:full

# After testing
npm run backup:cleanup 7
```

### 2. Staging Environment

**Frequency:** Daily
**Type:** Full backup
**Retention:** 30 days

```bash
# Set up cron job
0 2 * * * cd /path/to/project && npm run backup:auto:daily
```

### 3. Production Environment

**Recommended Strategy:**

- **Daily:** Full backup (30 days retention)
- **Weekly:** Full backup (90 days retention)
- **Monthly:** Full backup (365 days retention)
- **Schema:** Weekly schema backup (30 days retention)

**Cron Setup:**

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup:auto:daily

# Weekly backup on Sunday at 3 AM
0 3 * * 0 cd /path/to/project && npm run backup:auto:weekly

# Monthly backup on 1st at 4 AM
0 4 1 * * cd /path/to/project && npm run backup:auto:monthly

# Schema backup on Wednesday at 1 AM
0 1 * * 3 cd /path/to/project && npm run backup:auto:schema
```

### 4. Critical Data Backup

For critical tables (users, payments, products):

```bash
# Daily critical data backup
npm run backup:auto:tables "users,payments,products"
```

## Monitoring and Maintenance

### 1. Backup Logs

Backup logs are stored in `./backups/backup.log`:

```bash
tail -f ./backups/backup.log
```

### 2. Disk Space Monitoring

Check backup directory size:

```bash
du -sh ./backups/
```

### 3. Backup Verification

Test restore on a temporary database:

```bash
# Create test database
npm run restore:create-db "test_restore"

# Restore to test database
DATABASE_URL="postgresql://user:pass@host:port/test_restore" npm run restore:full "backup.backup"

# Test application
# ... test your application ...

# Clean up
npm run restore:drop-db "test_restore"
```

### 4. Backup Health Check

Create a monitoring script:

```bash
#!/bin/bash
# backup-health-check.sh

# Check if backups exist
if [ ! -f "./backups/backup.log" ]; then
    echo "❌ No backup logs found"
    exit 1
fi

# Check last backup time
LAST_BACKUP=$(tail -n 50 ./backups/backup.log | grep "Backup completed" | tail -n 1 | cut -d' ' -f1,2)

if [ -z "$LAST_BACKUP" ]; then
    echo "❌ No recent backups found"
    exit 1
fi

echo "✅ Last backup: $LAST_BACKUP"

# Check backup directory size
SIZE=$(du -sh ./backups/ | cut -f1)
echo "📊 Backup directory size: $SIZE"
```

## Troubleshooting

### Common Issues

#### 1. Connection Failed

**Error:** `connection to server at "host" failed`

**Solutions:**

- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Verify network connectivity
- Check firewall settings

```bash
# Test connection
npm run restore:test
```

#### 2. Permission Denied

**Error:** `permission denied for database`

**Solutions:**

- Check database user permissions
- Verify database exists
- Ensure user has backup privileges

```bash
# Grant backup privileges
GRANT CONNECT ON DATABASE your_database TO your_user;
GRANT USAGE ON SCHEMA public TO your_user;
```

#### 3. Insufficient Disk Space

**Error:** `No space left on device`

**Solutions:**

- Clean up old backups
- Increase disk space
- Move backups to external storage

```bash
# Clean old backups
npm run backup:cleanup 7

# Check disk space
df -h
```

#### 4. Backup File Corrupted

**Error:** `invalid backup file format`

**Solutions:**

- Verify backup file integrity
- Check for disk errors
- Restore from previous backup

```bash
# Check file integrity
file ./backups/backup.backup

# Test restore
npm run restore:test
```

### Debug Commands

```bash
# Check PostgreSQL version
psql --version

# Check pg_dump version
pg_dump --version

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check backup file format
file ./backups/backup.backup

# View backup contents (for SQL files)
head -n 20 ./backups/backup.sql
```

## Security Considerations

### 1. Backup File Security

- **Encrypt sensitive backups:**

```bash
# Encrypt backup file
gpg --encrypt --recipient your-email@domain.com backup.backup

# Decrypt for restore
gpg --decrypt backup.backup.gpg > backup.backup
```

- **Secure backup storage:**

```bash
# Move to secure location
mv ./backups/ /secure/backup-location/

# Set proper permissions
chmod 600 /secure/backup-location/*
```

### 2. Environment Variables

- Never commit `DATABASE_URL` to version control
- Use different databases for dev/staging/prod
- Rotate database passwords regularly

### 3. Network Security

- Use SSL connections for remote databases
- Restrict database access by IP
- Use VPN for remote backups

### 4. Backup Verification

Regularly test restore procedures:

```bash
# Monthly restore test
npm run restore:create-db "test_restore_$(date +%Y%m)"
DATABASE_URL="postgresql://user:pass@host:port/test_restore_$(date +%Y%m)" npm run restore:full "latest_backup.backup"
# ... test application ...
npm run restore:drop-db "test_restore_$(date +%Y%m)"
```

## Advanced Configuration

### Custom Backup Scripts

Create custom backup scenarios:

```typescript
// scripts/custom-backup.ts
import { DatabaseBackup } from "./backup-database";

const backup = new DatabaseBackup();

// Custom backup for specific tables
await backup.createBackup({
	format: "sql",
	tables: ["users", "payments"],
	filename: `critical-data-${new Date().toISOString().split("T")[0]}.sql`,
	compression: true,
});
```

### Cloud Storage Integration

Upload backups to cloud storage:

```bash
# Upload to AWS S3
aws s3 cp ./backups/ s3://your-bucket/backups/ --recursive

# Upload to Google Cloud Storage
gsutil cp ./backups/* gs://your-bucket/backups/

# Upload to Azure Blob Storage
az storage blob upload-batch --source ./backups/ --destination your-container
```

### Monitoring Integration

Integrate with monitoring systems:

```bash
# Send to monitoring service
curl -X POST https://your-monitoring-service.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"backup_status": "success", "file": "backup.backup", "size": "10MB"}'
```

## Best Practices

1. **Test restores regularly** - Monthly at minimum
2. **Monitor backup sizes** - Alert on unusual growth
3. **Verify backup integrity** - Check file checksums
4. **Document procedures** - Keep restore procedures updated
5. **Train team members** - Ensure multiple people can restore
6. **Keep multiple copies** - Local + remote storage
7. **Monitor backup logs** - Set up alerts for failures
8. **Plan for disasters** - Have recovery procedures ready

## Emergency Procedures

### Complete Database Loss

1. **Stop application**
2. **Assess damage**
3. **Choose recovery point**
4. **Restore from backup**
5. **Verify data integrity**
6. **Restart application**

```bash
# Emergency restore procedure
npm run restore:drop-db "damaged_database"
npm run restore:create-db "damaged_database"
npm run restore:full "latest_backup.backup"
npm run restore:test
```

### Partial Data Loss

1. **Identify affected tables**
2. **Restore specific tables**
3. **Verify data consistency**
4. **Update application if needed**

```bash
# Restore specific tables
npm run restore:tables "backup.sql" "users,products"
```

This comprehensive backup system ensures your data is protected and recoverable in any scenario.
