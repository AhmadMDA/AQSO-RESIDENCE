'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Read JSON files
      const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../users.json'), 'utf8'));
      const profilesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../profiles.json'), 'utf8'));
      const transactionsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../transactions.json'), 'utf8'));
      const customersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../customers.json'), 'utf8'));

      // Insert Users
      if (usersData && usersData.length > 0) {
        const users = usersData.map(user => ({
          email: user.email,
          password: user.password,
          role: user.role,
          created_at: new Date(),
          updated_at: new Date()
        }));
        await queryInterface.bulkInsert('users', users, {});
        console.log(`Imported ${users.length} users`);
      }

      // Insert Profiles
      if (profilesData && Object.keys(profilesData).length > 0) {
        const profiles = Object.entries(profilesData).map(([email, data]) => ({
          email: email,
          nama: data.nama || null,
          alamat: data.alamat || null,
          no_telpon: data.no_telpon || null,
          foto_profil: data.foto_profil || null,
          created_at: new Date(),
          updated_at: new Date()
        }));
        await queryInterface.bulkInsert('profiles', profiles, {});
        console.log(`Imported ${profiles.length} profiles`);
      }

      // Insert Transactions
      if (transactionsData && transactionsData.length > 0) {
        const transactions = transactionsData.map(tx => ({
          no_kwitansi: tx.no_kwitansi,
          diterima_dari: tx.diterima_dari,
          untuk_pembayaran: tx.untuk_pembayaran,
          ket_pembayaran: tx.ket_pembayaran || null,
          nama_marketing: tx.nama_marketing || null,
          jumlah: tx.jumlah || 0,
          terbilang: tx.terbilang || null,
          tanggal: tx.tanggal,
          created_at: new Date(),
          updated_at: new Date()
        }));
        await queryInterface.bulkInsert('transactions', transactions, {});
        console.log(`Imported ${transactions.length} transactions`);
      }

      // Insert Customers
      if (customersData && customersData.length > 0) {
        const customers = customersData.map(customer => ({
          tanggal: customer.tanggal,
          nama: customer.nama,
          alamat: customer.alamat || null,
          no_telpon: customer.no_telpon || null,
          type: customer.type || null,
          harga: customer.harga || 0,
          no_rumah: customer.no_rumah || null,
          keterangan: customer.keterangan || null,
          lunas: customer.lunas || false,
          created_at: new Date(),
          updated_at: new Date()
        }));
        await queryInterface.bulkInsert('customers', customers, {});
        console.log(`Imported ${customers.length} customers`);
      }

      console.log('JSON data import completed successfully!');
    } catch (error) {
      console.error('Error importing JSON data:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded data
    await queryInterface.bulkDelete('customers', null, {});
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('profiles', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};