# Database Migration - JSON to MySQL

## ✅ What Changed

Your AQSO Residence backend now saves ALL data directly to MySQL database instead of JSON files!

### Before (JSON Files):
```
backend/
├── users.json          ❌ Not used anymore
├── customers.json      ❌ Not used anymore  
├── transactions.json   ❌ Not used anymore
└── profiles.json       ❌ Not used anymore
```

### After (MySQL Database):
```
MySQL Database: aqso_db
├── users           ✅ All users
├── customers       ✅ All customers
├── transactions    ✅ All transactions
└── profiles        ✅ All profiles
```

## 🚀 Quick Setup (3 Steps)

### Step 1: Create MySQL Database

Open MySQL (phpMyAdmin or MySQL Workbench) and run:

```sql
CREATE DATABASE aqso_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Run Migrations

**Option A - Automatic (Recommended):**
```
Double-click: backend\check-and-start.bat
```

This will:
- Install dependencies
- Run database migrations
- Start the server

**Option B - Manual:**
```cmd
cd backend
npm install
npx sequelize-cli db:migrate
node server.js
```

### Step 3: Import Existing Data (Optional)

If you have existing data in JSON files:

```cmd
cd backend
npx sequelize-cli db:seed:all
```

This imports all data from JSON files to MySQL.

## 📊 Database Tables

### users
- id (auto increment)
- email (unique)
- password (hashed)
- role (admin/pemilik)
- created_at
- updated_at

### customers
- id (auto increment)
- tanggal
- nama
- alamat
- no_telpon
- type
- harga
- no_rumah
- keterangan
- lunas
- created_at
- updated_at

### transactions
- id (auto increment)
- no_kwitansi (unique)
- diterima_dari
- untuk_pembayaran
- ket_pembayaran
- nama_marketing
- jumlah
- terbilang
- tanggal
- created_at
- updated_at

### profiles
- id (auto increment)
- email (unique, foreign key to users)
- nama
- alamat
- no_telpon
- foto_profil
- created_at
- updated_at

## ✨ Benefits

### Real-time Database Storage
- ✅ All new users saved to MySQL
- ✅ All new customers saved to MySQL
- ✅ All new transactions saved to MySQL
- ✅ All updates saved to MySQL
- ✅ All deletes removed from MySQL

### Better Performance
- ✅ Faster queries with indexes
- ✅ Concurrent access support
- ✅ ACID transactions
- ✅ Data integrity

### Scalability
- ✅ Handle thousands of records
- ✅ Multiple users simultaneously
- ✅ Backup and restore easily
- ✅ Production ready

## 🧪 Testing

### Test Database Connection

1. Start server:
   ```
   backend\check-and-start.bat
   ```

2. Check console output:
   ```
   [Database] Connection established successfully
   [Server] OAuth routes loaded successfully
   Auth server listening on http://localhost:4000
   ```

### Test CRUD Operations

**Create User:**
```
POST http://localhost:4000/api/register
{
  "email": "test@test.com",
  "password": "password123",
  "role": "admin"
}
```

**Create Customer:**
```
POST http://localhost:4000/api/customers
{
  "nama": "Test Customer",
  "tanggal": "2025-12-01",
  "harga": 100000
}
```

**Create Transaction:**
```
POST http://localhost:4000/api/transactions
{
  "diterima_dari": "Test",
  "untuk_pembayaran": "Test Payment",
  "jumlah": 50000,
  "tanggal": "2025-12-01"
}
```

### Verify in MySQL

```sql
USE aqso_db;

-- Check users
SELECT * FROM users;

-- Check customers
SELECT * FROM customers;

-- Check transactions
SELECT * FROM transactions;
```

## 📝 Server Console Logs

You'll now see database logs:

```
[Database] Connection established successfully
[Database] New user registered: user@example.com with role: admin
[Database] New customer created: John Doe (ID: 1)
[Database] New transaction created: 001
[Database] Customer updated: John Doe (ID: 1)
[Database] Transaction deleted: 001 (ID: 1)
```

## 🔧 Configuration

Database settings in `backend/config/config.json`:

```json
{
  "development": {
    "username": "root",
    "password": "",
    "database": "aqso_db",
    "host": "localhost",
    "dialect": "mysql"
  }
}
```

Change if your MySQL has different credentials.

## ⚠️ Important Notes

### JSON Files (Backup)
- Keep JSON files as backup
- Don't delete them yet
- They're not used by server anymore
- Can be used for data recovery

### OAuth Login
- Now saves users to MySQL
- Email confirmation still works
- All new OAuth users go to database

### Data Migration
- Existing JSON data can be imported
- Run seeder to import: `npx sequelize-cli db:seed:all`
- Only run once to avoid duplicates

## 🐛 Troubleshooting

### Error: "Unable to connect to database"

**Cause:** MySQL not running or database doesn't exist

**Fix:**
1. Start MySQL (XAMPP/WAMP)
2. Create database:
   ```sql
   CREATE DATABASE aqso_db;
   ```

### Error: "Table doesn't exist"

**Cause:** Migrations not run

**Fix:**
```cmd
cd backend
npx sequelize-cli db:migrate
```

### Error: "Duplicate entry"

**Cause:** Trying to import data twice

**Fix:**
```cmd
cd backend
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all
```

### Server starts but no database logs

**Cause:** Database connection failed silently

**Fix:**
1. Check MySQL is running
2. Verify database exists
3. Check credentials in `config/config.json`

## 📚 Migration Commands

```cmd
# Run all migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status

# Run all seeders
npx sequelize-cli db:seed:all

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```

## ✅ Success Checklist

- [ ] MySQL server running
- [ ] Database `aqso_db` created
- [ ] Migrations completed successfully
- [ ] Server starts without errors
- [ ] Console shows "Database connection established"
- [ ] Can create new users
- [ ] Can create new customers
- [ ] Can create new transactions
- [ ] Data visible in MySQL

## 🎉 You're Done!

Your application now uses MySQL database for all data storage. All new users, customers, and transactions are automatically saved to the database!

---

**Need Help?**
- Check server console for detailed error messages
- Verify MySQL is running in XAMPP/WAMP
- Ensure database `aqso_db` exists
- Review `backend/config/config.json` for correct credentials