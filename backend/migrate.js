const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runMigration() {
  console.log('Starting database migration...\n');

  try {
    // Step 1: Run migrations
    console.log('Step 1: Running migrations...');
    const { stdout: migrateOut, stderr: migrateErr } = await execPromise('npx sequelize-cli db:migrate');
    console.log(migrateOut);
    if (migrateErr) console.error(migrateErr);

    // Step 2: Run seeders (import JSON data)
    console.log('\nStep 2: Importing JSON data...');
    const { stdout: seedOut, stderr: seedErr } = await execPromise('npx sequelize-cli db:seed:all');
    console.log(seedOut);
    if (seedErr) console.error(seedErr);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in MySQL: USE aqso_db; SELECT * FROM users;');
    console.log('2. Update server.js to use Sequelize models');
    console.log('3. Test all API endpoints');
    console.log('4. Backup JSON files before removing them\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure MySQL server is running');
    console.error('2. Check database credentials in config/config.json');
    console.error('3. Create database: CREATE DATABASE aqso_db;');
    console.error('4. Check error details above\n');
    process.exit(1);
  }
}

runMigration();