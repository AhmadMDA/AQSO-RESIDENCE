# Database Migration Guide - AQSO Residence

## Prerequisites

1. MySQL server running on localhost
2. Node.js and npm installed
3. sequelize-cli installed globally or as dev dependency

## Setup Instructions

### 1. Create Database

First, create the MySQL database:

```sql
CREATE DATABASE aqso_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or for production:
```sql
CREATE DATABASE aqso_db_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Database Connection

Edit `backend/config/config.json` to match your MySQL credentials:

```json
{
  "development": {
    "username": "root",
    "password": "your_password",
    "database": "aqso_db",
    "host": "localhost",
    "dialect": "mysql"
  }
}
```

### 3. Run Migrations

Navigate to the backend directory and run:

```bash
cd backend
npx sequelize-cli db:migrate
```

This will create all tables:
- `users` - User authentication table
- `profiles` - User profile information
- `transactions` - Transaction/receipt records
- `customers` - Customer/kavling data

### 4. Verify Migration

Check if tables were created:

```sql
USE aqso_db;
SHOW TABLES;
DESCRIBE users;
DESCRIBE profiles;
DESCRIBE transactions;
DESCRIBE customers;
```

### 5. Seed Initial Data (Optional)

To migrate existing JSON data to MySQL, you can create a seeder:

```bash
npx sequelize-cli seed:generate --name seed-initial-data
```

Or use the provided migration script below.

## Migration Commands Reference

### Run all pending migrations
```bash
npx sequelize-cli db:migrate
```

### Undo last migration
```bash
npx sequelize-cli db:migrate:undo
```

### Undo all migrations
```bash
npx sequelize-cli db:migrate:undo:all
```

### Check migration status
```bash
npx sequelize-cli db:migrate:status
```

## Database Schema

### Users Table
- `id` (INT, PK, AUTO_INCREMENT)
- `email` (VARCHAR(255), UNIQUE, NOT NULL)
- `password` (VARCHAR(255), NOT NULL)
- `role` (ENUM: 'admin', 'pemilik', NOT NULL)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Profiles Table
- `id` (INT, PK, AUTO_INCREMENT)
- `email` (VARCHAR(255), UNIQUE, FK to users.email)
- `nama` (VARCHAR(255))
- `alamat` (TEXT)
- `no_telpon` (VARCHAR(50))
- `foto_profil` (VARCHAR(255))
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Transactions Table
- `id` (INT, PK, AUTO_INCREMENT)
- `no_kwitansi` (VARCHAR(50), UNIQUE, NOT NULL)
- `diterima_dari` (VARCHAR(255), NOT NULL)
- `untuk_pembayaran` (VARCHAR(255), NOT NULL)
- `ket_pembayaran` (VARCHAR(255))
- `nama_marketing` (VARCHAR(255))
- `jumlah` (DECIMAL(15,2), NOT NULL)
- `terbilang` (VARCHAR(500))
- `tanggal` (DATE, NOT NULL)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Customers Table
- `id` (INT, PK, AUTO_INCREMENT)
- `tanggal` (DATE, NOT NULL)
- `nama` (VARCHAR(255), NOT NULL)
- `alamat` (TEXT)
- `no_telpon` (VARCHAR(50))
- `type` (VARCHAR(100))
- `harga` (DECIMAL(15,2), NOT NULL)
- `no_rumah` (VARCHAR(50))
- `keterangan` (TEXT)
- `lunas` (BOOLEAN, DEFAULT false)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

## Migrating Existing JSON Data

To migrate your existing JSON data to MySQL, create and run this seeder:

```bash
npx sequelize-cli seed:generate --name import-json-data
```

See `seeders/` directory for the implementation.

## Troubleshooting

### Error: Access denied for user
- Check MySQL username and password in `config/config.json`
- Ensure MySQL server is running

### Error: Database doesn't exist
- Create the database first using the SQL command above

### Error: Table already exists
- Run `npx sequelize-cli db:migrate:undo:all` to reset
- Or manually drop tables and re-run migrations

## Next Steps

After successful migration:
1. Update `server.js` to use Sequelize models instead of JSON files
2. Test all API endpoints
3. Backup JSON files before removing them
4. Update application to use database queries