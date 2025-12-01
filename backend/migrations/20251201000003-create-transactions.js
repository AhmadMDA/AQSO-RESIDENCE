'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      no_kwitansi: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      diterima_dari: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      untuk_pembayaran: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      ket_pembayaran: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      nama_marketing: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      jumlah: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      terbilang: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for faster lookups
    await queryInterface.addIndex('transactions', ['no_kwitansi']);
    await queryInterface.addIndex('transactions', ['tanggal']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transactions');
  }
};