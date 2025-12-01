# Quick Start - MySQL Migration

## Step-by-Step Guide

### 1. Create MySQL Database

Open MySQL command line or phpMyAdmin and run:

```sql
CREATE DATABASE aqso_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Database (if needed)

Edit `backend/config/config.json` if your MySQL password is not empty:

```json
{
  "development": {
    "username": "root",
    "password": "YOUR_PASSWORD_HERE",
    "database": "aqso_db",
    "host": "localhost",
    "dialect": "mysql"
  }
}
```

### 3. Run Migration Script

From the project root directory:

```bash
cd backend
node migrate.js
```

This will:
- Create all database tables
- Import existing JSON data into MySQL

### 4. Verify Migration

Check your MySQL database:

```sql
USE aqso_db;
SHOW TABLES;
SELECT * FROM users;
SELECT * FROM customers;
SELECT * FROM transactions;
```

## Manual Migration (Alternative)

If the automated script doesn't work, run these commands manually:

```bash
cd backend

# Create tables
npx sequelize-cli db:migrate

# Import JSON data
npx sequelize-cli db:seed:all
```

## Rollback Migration

To undo everything:

```bash
cd backend

# Remove seeded data
npx sequelize-cli db:seed:undo:all

# Drop all tables
npx sequelize-cli db:migrate:undo:all
```

## Common Issues

### "Access denied for user 'root'@'localhost'"
- Update password in `config/config.json`
- Or create a new MySQL user with proper permissions

### "Unknown database 'aqso_db'"
- Create the database first using the SQL command in Step 1

### "Table 'users' already exists"
- Tables were already created
- Either use existing tables or run: `npx sequelize-cli db:migrate:undo:all`

## File Structure

```
backend/
├── config/
│   ├── config.json          # Database configuration
│   └── database.js          # Sequelize instance
├── migrations/              # Database migration files
│   ├── 20251201000001-create-users.js
│   ├── 20251201000002-create-profiles.js
│   ├── 20251201000003-create-transactions.js
│   └── 20251201000004-create-customers.js
├── models/                  # Sequelize models
│   ├── index.js
│   ├── User.js
│   ├── Profile.js
│   ├── Transaction.js
│   └── Customer.js
├── seeders/                 # Data seeders
│   └── 20251201000001-import-json-data.js
├── .sequelizerc            # Sequelize configuration
├── migrate.js              # Migration helper script
└── server.js               # Express server
```

## Next Steps

After successful migration, you can:

1. **Keep using JSON files** - No changes needed, JSON files still work
2. **Switch to MySQL** - Update server.js to use Sequelize models
3. **Use both** - Gradually migrate endpoints one by one

For switching to MySQL, see `MIGRATION_README.md` for detailed instructions.