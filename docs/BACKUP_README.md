# Database Backup System

Quick reference for backing up and restoring your PostgreSQL database.

## 🚀 Quick Start

### 1. Test Connection

```bash
npm run restore:test
```

### 2. Create Full Backup (Recommended)

```bash
npm run backup:full
```

### 3. List Available Backups

```bash
npm run backup:list
```

## 📋 Available Commands

### Manual Backups

```bash
# Full backup (recommended)
npm run backup:full

# Schema-only backup
npm run backup:schema

# Data-only backup
npm run backup:data

# Table-specific backup
npm run backup:tables "users,products"

# List backups
npm run backup:list

# Cleanup old backups
npm run backup:cleanup
```

### Automated Backups

```bash
# Daily backup (30 days retention)
npm run backup:auto:daily

# Weekly backup (90 days retention)
npm run backup:auto:weekly

# Monthly backup (365 days retention)
npm run backup:auto:monthly

# Schema backup (30 days retention)
npm run backup:auto:schema

# Table backup (7 days retention)
npm run backup:auto:tables "users,products,payments"

# Show backup statistics
npm run backup:auto:stats
```

### Restore Operations

```bash
# List available backups for restore
npm run restore:list

# Test database connection
npm run restore:test

# Full restore
npm run restore:full "backup-file.backup"

# Schema-only restore
npm run restore:schema "backup-file.sql"

# Data-only restore
npm run restore:data "backup-file.sql"

# Table-specific restore
npm run restore:tables "backup-file.sql" "table1,table2"

# Create new database
npm run restore:create-db "database-name"

# Drop database
npm run restore:drop-db "database-name"
```

### Quick Shell Script

```bash
# Make executable (first time only)
chmod +x scripts/quick-backup.sh

# Quick commands
./scripts/quick-backup.sh full
./scripts/quick-backup.sh tables "users,products"
./scripts/quick-backup.sh list
./scripts/quick-backup.sh cleanup 7
./scripts/quick-backup.sh test
```

## 🔧 Environment Variables

Set these in your `.env` file:

```bash
# Required
DATABASE_URL="postgresql://username:password@host:port/database"

# Optional
BACKUP_DIR="./backups"
WEBHOOK_URL="https://your-webhook-url.com"
```

## 📅 Automated Backup Schedule

### Development

- **Before major changes:** `npm run backup:full`
- **Cleanup:** `npm run backup:cleanup 7`

### Staging

- **Daily at 2 AM:** `npm run backup:auto:daily`

### Production

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

## 📊 Backup Types

| Type   | Command         | Format    | Compression | Use Case        |
| ------ | --------------- | --------- | ----------- | --------------- |
| Full   | `backup:full`   | `.backup` | Yes         | Complete backup |
| Schema | `backup:schema` | `.sql`    | No          | Structure only  |
| Data   | `backup:data`   | `.sql`    | No          | Data only       |
| Tables | `backup:tables` | `.sql`    | No          | Specific tables |

## 🛡️ Security Best Practices

1. **Encrypt sensitive backups:**

    ```bash
    gpg --encrypt --recipient your-email@domain.com backup.backup
    ```

2. **Secure storage:**

    ```bash
    chmod 600 ./backups/*
    ```

3. **Regular testing:**
    ```bash
    # Monthly restore test
    npm run restore:create-db "test_restore"
    DATABASE_URL="postgresql://user:pass@host:port/test_restore" npm run restore:full "latest_backup.backup"
    npm run restore:drop-db "test_restore"
    ```

## 🚨 Emergency Procedures

### Complete Database Loss

```bash
# 1. Stop application
# 2. Restore from backup
npm run restore:drop-db "damaged_database"
npm run restore:create-db "damaged_database"
npm run restore:full "latest_backup.backup"
npm run restore:test
# 3. Restart application
```

### Partial Data Loss

```bash
# Restore specific tables
npm run restore:tables "backup.sql" "users,products"
```

## 📈 Monitoring

### Check Backup Logs

```bash
tail -f ./backups/backup.log
```

### Monitor Disk Space

```bash
du -sh ./backups/
```

### Backup Health Check

```bash
npm run backup:auto:stats
```

## 🔍 Troubleshooting

### Common Issues

1. **Connection Failed**

    ```bash
    npm run restore:test
    # Check DATABASE_URL and network connectivity
    ```

2. **Permission Denied**

    ```bash
    # Grant backup privileges
    GRANT CONNECT ON DATABASE your_database TO your_user;
    ```

3. **Insufficient Disk Space**
    ```bash
    npm run backup:cleanup 7
    df -h
    ```

### Debug Commands

```bash
# Check PostgreSQL tools
psql --version
pg_dump --version

# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check backup file
file ./backups/backup.backup
```

## 📚 Documentation

- **Full Guide:** [docs/database-backup-guide.md](docs/database-backup-guide.md)
- **Production Setup:** [docs/prisma-production-setup.md](docs/prisma-production-setup.md)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full backup guide
3. Check backup logs: `tail -f ./backups/backup.log`
4. Test database connection: `npm run restore:test`

---

**Remember:** Always test your restore procedures regularly and keep multiple backup copies in different locations!
