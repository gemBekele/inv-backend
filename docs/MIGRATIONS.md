# TypeORM Migrations Guide

This document explains how to work with migrations in this NestJS project using TypeORM.

## Configuration Changes Made

### 1. Disabled Auto-Synchronization
- **Before**: `synchronize: process.env.NODE_ENV === 'development'`
- **After**: `synchronize: false`

**Why this change?**
- Auto-synchronization automatically applies schema changes without creating migration files
- This bypasses the migration system and makes it impossible to track database changes
- In production, you should NEVER use synchronization as it can cause data loss

### 2. Updated Migration Scripts
- Added a custom shell script (`scripts/migration.sh`) for better migration management
- Updated package.json scripts to use the new shell script
- Now supports custom migration names properly

## Migration Commands

### Generate Migration (when you have entity changes)
```bash
# Using npm
npm run migration:generate -- --name=add_new_feature

# Using yarn
yarn migration:generate --name=add_new_feature

# Using the shell script directly
./scripts/migration.sh generate --name=add_new_feature
```

### Create Empty Migration
```bash
# Using npm
npm run migration:create -- --name=custom_changes

# Using yarn
yarn migration:create --name=custom_changes

# Using the shell script directly
./scripts/migration.sh create --name=custom_changes
```

### Run Migrations
```bash
# Using npm
npm run migration:run

# Using yarn
yarn migration:run

# Using the shell script directly
./scripts/migration.sh run
```

### Revert Last Migration
```bash
# Using npm
npm run migration:revert

# Using yarn
yarn migration:revert

# Using the shell script directly
./scripts/migration.sh revert
```

## Workflow for Schema Changes

### 1. Make Entity Changes
Edit your entity files (e.g., `src/modules/*/entities/*.entity.ts`)

### 2. Generate Migration
```bash
yarn migration:generate --name=descriptive_name
```

### 3. Review Generated Migration
- Check the generated migration file in `src/database/migrations/`
- Ensure the changes are correct and safe
- Add any custom logic if needed (seeds, data transformations, etc.)

### 4. Run Migration
```bash
yarn migration:run
```

### 5. Test Your Changes
- Start your application: `yarn start:dev`
- Verify the database schema is correct
- Test your application functionality

## Best Practices

### Migration Naming
Use descriptive names that clearly indicate what the migration does:
- ✅ `add_user_profile_table`
- ✅ `update_product_pricing_fields`
- ✅ `remove_deprecated_columns`
- ❌ `migration1`
- ❌ `update`
- ❌ `fixes`

### Migration Content
- **Always review** generated migrations before running them
- **Add data migrations** when needed (for transforming existing data)
- **Include rollback logic** in the `down()` method
- **Test migrations** on a copy of production data before deploying

### Development Workflow
1. **Never** modify existing migration files that have been run in production
2. **Always** create new migrations for schema changes
3. **Test migrations** locally before committing
4. **Run migrations** as part of your deployment process

## Troubleshooting

### "No changes in database schema were found"
This means your entities are already in sync with the database. Either:
1. You haven't made any entity changes
2. You have synchronization enabled (which we've now disabled)
3. The entities are exactly matching the current database schema

### Migration Fails During Generation
1. Check for circular dependencies in your entities
2. Ensure all entity relationships are properly defined
3. Verify your TypeORM configuration is correct
4. Check that all required imports are present

### Migration Fails During Execution
1. Check the migration SQL for syntax errors
2. Ensure you have proper database permissions
3. Verify foreign key constraints are satisfied
4. Check for data conflicts (unique constraints, etc.)

## File Structure
```
src/
├── config/
│   ├── database.config.ts     # NestJS database configuration
│   └── typeorm.config.ts      # TypeORM CLI configuration
├── database/
│   ├── entities/              # Shared entities
│   └── migrations/            # Generated migration files
└── modules/
    └── */entities/            # Module-specific entities

scripts/
└── migration.sh              # Migration helper script

docs/
└── MIGRATIONS.md             # This documentation
```

## Environment Variables
Make sure these are set in your `.env` file:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
```

## Common Issues Fixed

### 1. Entity Relationship Issues
Fixed several incorrect entity relationships that were preventing migration generation:
- User ↔ Shop relationships
- User ↔ Warehouse relationships  
- Shop ↔ Sales relationships
- Warehouse ↔ Employee relationships

### 2. Missing Imports
Added missing entity imports that were causing TypeORM to not recognize relationships.

### 3. Synchronization Disabled
Disabled auto-synchronization to force the use of migrations for all schema changes.

---

For more information about TypeORM migrations, see the official documentation:
https://typeorm.io/migrations
