#!/bin/bash

# Quick Database Backup Script
# Usage: ./scripts/quick-backup.sh [type] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_URL="${DATABASE_URL}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL environment variable is required${NC}"
    exit 1
fi

# Parse database URL
parse_db_url() {
    local url="$1"
    local protocol="${url%%://*}"
    local rest="${url#*://}"
    local user_pass="${rest%%@*}"
    local host_port_db="${rest#*@}"
    local host_port="${host_port_db%%/*}"
    local database="${host_port_db#*/}"
    
    local user="${user_pass%%:*}"
    local pass="${user_pass#*:}"
    local host="${host_port%%:*}"
    local port="${host_port#*:}"
    
    if [ "$port" = "$host_port" ]; then
        port="5432"
    fi
    
    echo "$host:$port:$database:$user:$pass"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        echo -e "${GREEN}✅ Created backup directory: $BACKUP_DIR${NC}"
    fi
}

# Generate filename
generate_filename() {
    local type="$1"
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    echo "${type}-backup-${timestamp}"
}

# Full backup
full_backup() {
    local filename=$(generate_filename "full")
    local filepath="$BACKUP_DIR/${filename}.backup"
    
    echo -e "${BLUE}🔄 Creating full backup...${NC}"
    
    PGPASSWORD=$(parse_db_url "$DATABASE_URL" | cut -d: -f5) pg_dump \
        --host=$(parse_db_url "$DATABASE_URL" | cut -d: -f1) \
        --port=$(parse_db_url "$DATABASE_URL" | cut -d: -f2) \
        --username=$(parse_db_url "$DATABASE_URL" | cut -d: -f4) \
        --dbname=$(parse_db_url "$DATABASE_URL" | cut -d: -f3) \
        --format=custom \
        --compress=9 \
        --file="$filepath"
    
    local size=$(du -h "$filepath" | cut -f1)
    echo -e "${GREEN}✅ Full backup created: $filepath (${size})${NC}"
}

# Schema backup
schema_backup() {
    local filename=$(generate_filename "schema")
    local filepath="$BACKUP_DIR/${filename}.sql"
    
    echo -e "${BLUE}🔄 Creating schema backup...${NC}"
    
    PGPASSWORD=$(parse_db_url "$DATABASE_URL" | cut -d: -f5) pg_dump \
        --host=$(parse_db_url "$DATABASE_URL" | cut -d: -f1) \
        --port=$(parse_db_url "$DATABASE_URL" | cut -d: -f2) \
        --username=$(parse_db_url "$DATABASE_URL" | cut -d: -f4) \
        --dbname=$(parse_db_url "$DATABASE_URL" | cut -d: -f3) \
        --schema-only \
        --file="$filepath"
    
    local size=$(du -h "$filepath" | cut -f1)
    echo -e "${GREEN}✅ Schema backup created: $filepath (${size})${NC}"
}

# Data backup
data_backup() {
    local filename=$(generate_filename "data")
    local filepath="$BACKUP_DIR/${filename}.sql"
    
    echo -e "${BLUE}🔄 Creating data backup...${NC}"
    
    PGPASSWORD=$(parse_db_url "$DATABASE_URL" | cut -d: -f5) pg_dump \
        --host=$(parse_db_url "$DATABASE_URL" | cut -d: -f1) \
        --port=$(parse_db_url "$DATABASE_URL" | cut -d: -f2) \
        --username=$(parse_db_url "$DATABASE_URL" | cut -d: -f4) \
        --dbname=$(parse_db_url "$DATABASE_URL" | cut -d: -f3) \
        --data-only \
        --file="$filepath"
    
    local size=$(du -h "$filepath" | cut -f1)
    echo -e "${GREEN}✅ Data backup created: $filepath (${size})${NC}"
}

# Table backup
table_backup() {
    local tables="$1"
    local filename=$(generate_filename "tables")
    local filepath="$BACKUP_DIR/${filename}.sql"
    
    echo -e "${BLUE}🔄 Creating table backup for: $tables${NC}"
    
    local table_args=""
    IFS=',' read -ra TABLE_ARRAY <<< "$tables"
    for table in "${TABLE_ARRAY[@]}"; do
        table_args="$table_args --table=$table"
    done
    
    PGPASSWORD=$(parse_db_url "$DATABASE_URL" | cut -d: -f5) pg_dump \
        --host=$(parse_db_url "$DATABASE_URL" | cut -d: -f1) \
        --port=$(parse_db_url "$DATABASE_URL" | cut -d: -f2) \
        --username=$(parse_db_url "$DATABASE_URL" | cut -d: -f4) \
        --dbname=$(parse_db_url "$DATABASE_URL" | cut -d: -f3) \
        $table_args \
        --file="$filepath"
    
    local size=$(du -h "$filepath" | cut -f1)
    echo -e "${GREEN}✅ Table backup created: $filepath (${size})${NC}"
}

# List backups
list_backups() {
    echo -e "${BLUE}📋 Available backups:${NC}"
    
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        echo -e "${YELLOW}No backups found in $BACKUP_DIR${NC}"
        return
    fi
    
    local total_size=0
    local count=0
    
    for file in "$BACKUP_DIR"/*.backup "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.gz; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local size=$(du -h "$file" | cut -f1)
            local modified=$(stat -c %y "$file" | cut -d' ' -f1)
            total_size=$(($total_size + $(du -k "$file" | cut -f1)))
            count=$((count + 1))
            echo -e "  ${filename} (${size}) - ${modified}"
        fi
    done
    
    if [ $count -gt 0 ]; then
        local total_mb=$((total_size / 1024))
        echo -e "${GREEN}📊 Total: $count backups, ${total_mb}MB${NC}"
    fi
}

# Cleanup old backups
cleanup_backups() {
    local days="${1:-30}"
    echo -e "${BLUE}🧹 Cleaning up backups older than $days days...${NC}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}No backup directory found${NC}"
        return
    fi
    
    local deleted=0
    local cutoff_date=$(date -d "$days days ago" +%s)
    
    for file in "$BACKUP_DIR"/*.backup "$BACKUP_DIR"/*.sql "$BACKUP_DIR"/*.gz; do
        if [ -f "$file" ]; then
            local file_date=$(stat -c %Y "$file")
            if [ $file_date -lt $cutoff_date ]; then
                rm "$file"
                echo -e "  🗑️  Deleted: $(basename "$file")"
                deleted=$((deleted + 1))
            fi
        fi
    done
    
    if [ $deleted -eq 0 ]; then
        echo -e "${GREEN}✅ No old backups to clean up${NC}"
    else
        echo -e "${GREEN}✅ Cleaned up $deleted old backups${NC}"
    fi
}

# Test connection
test_connection() {
    echo -e "${BLUE}🔍 Testing database connection...${NC}"
    
    PGPASSWORD=$(parse_db_url "$DATABASE_URL" | cut -d: -f5) psql \
        --host=$(parse_db_url "$DATABASE_URL" | cut -d: -f1) \
        --port=$(parse_db_url "$DATABASE_URL" | cut -d: -f2) \
        --username=$(parse_db_url "$DATABASE_URL" | cut -d: -f4) \
        --dbname=$(parse_db_url "$DATABASE_URL" | cut -d: -f3) \
        --command="SELECT version();" \
        --quiet \
        --tuples-only
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        exit 1
    fi
}

# Show usage
show_usage() {
    echo -e "${BLUE}🔄 Quick Database Backup Tool${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  full                    - Create full backup (recommended)"
    echo "  schema                  - Create schema-only backup"
    echo "  data                    - Create data-only backup"
    echo "  tables <table1,table2>  - Create table-specific backup"
    echo "  list                    - List all backups"
    echo "  cleanup [days]          - Clean up old backups (default: 30 days)"
    echo "  test                    - Test database connection"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL            - PostgreSQL connection string"
    echo "  BACKUP_DIR              - Backup directory (default: ./backups)"
    echo ""
    echo "Examples:"
    echo "  $0 full"
    echo "  $0 tables users,products"
    echo "  $0 cleanup 7"
    echo "  $0 test"
}

# Main script
main() {
    create_backup_dir
    
    case "${1:-}" in
        "full")
            full_backup
            ;;
        "schema")
            schema_backup
            ;;
        "data")
            data_backup
            ;;
        "tables")
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Please specify tables: $0 tables table1,table2${NC}"
                exit 1
            fi
            table_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_backups "$2"
            ;;
        "test")
            test_connection
            ;;
        *)
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 