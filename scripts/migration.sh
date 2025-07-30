#!/bin/sh

# TypeORM Migration Helper Script
# Usage: 
#   ./scripts/migration.sh generate --name=migration_name
#   ./scripts/migration.sh create --name=migration_name
#   ./scripts/migration.sh run
#   ./scripts/migration.sh revert

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
COMMAND=$1
MIGRATION_NAME=""

for arg in "$@"; do
    case $arg in
        --name=*)
            MIGRATION_NAME="${arg#*=}"
            shift
            ;;
    esac
done

# Validate command
if [[ -z "$COMMAND" ]]; then
    print_error "Please specify a command: generate, create, run, or revert"
    echo "Usage examples:"
    echo "  ./scripts/migration.sh generate --name=add_new_table"
    echo "  ./scripts/migration.sh create --name=empty_migration"
    echo "  ./scripts/migration.sh run"
    echo "  ./scripts/migration.sh revert"
    exit 1
fi

# Base TypeORM command
TYPEORM_CMD="npx typeorm-ts-node-commonjs"
DATA_SOURCE="-d src/config/typeorm.config.ts"

case $COMMAND in
    "generate")
        if [[ -z "$MIGRATION_NAME" ]]; then
            print_error "Migration name is required for generate command"
            echo "Usage: ./scripts/migration.sh generate --name=migration_name"
            exit 1
        fi
        
        print_info "Generating migration: $MIGRATION_NAME"
        MIGRATION_PATH="src/database/migrations/$MIGRATION_NAME"
        
        $TYPEORM_CMD migration:generate $MIGRATION_PATH $DATA_SOURCE
        
        if [[ $? -eq 0 ]]; then
            print_info "Migration generated successfully!"
        else
            print_error "Failed to generate migration"
            exit 1
        fi
        ;;
        
    "create")
        if [[ -z "$MIGRATION_NAME" ]]; then
            print_error "Migration name is required for create command"
            echo "Usage: ./scripts/migration.sh create --name=migration_name"
            exit 1
        fi
        
        print_info "Creating empty migration: $MIGRATION_NAME"
        MIGRATION_PATH="src/database/migrations/$MIGRATION_NAME"
        
        $TYPEORM_CMD migration:create $MIGRATION_PATH $DATA_SOURCE
        
        if [[ $? -eq 0 ]]; then
            print_info "Empty migration created successfully!"
        else
            print_error "Failed to create migration"
            exit 1
        fi
        ;;
        
    "run")
        print_info "Running pending migrations..."
        $TYPEORM_CMD migration:run $DATA_SOURCE
        
        if [[ $? -eq 0 ]]; then
            print_info "Migrations executed successfully!"
        else
            print_error "Failed to run migrations"
            exit 1
        fi
        ;;
        
    "revert")
        print_warn "Reverting last migration..."
        $TYPEORM_CMD migration:revert $DATA_SOURCE
        
        if [[ $? -eq 0 ]]; then
            print_info "Migration reverted successfully!"
        else
            print_error "Failed to revert migration"
            exit 1
        fi
        ;;
        
    *)
        print_error "Unknown command: $COMMAND"
        echo "Available commands: generate, create, run, revert"
        exit 1
        ;;
esac
