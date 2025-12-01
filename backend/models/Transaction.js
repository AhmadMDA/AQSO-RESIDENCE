'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      // Define associations here if needed
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    no_kwitansi: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    diterima_dari: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    untuk_pembayaran: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ket_pembayaran: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    nama_marketing: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    jumlah: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const value = this.getDataValue('jumlah');
        return value ? parseFloat(value) : 0;
      }
    },
    terbilang: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Transaction;
};