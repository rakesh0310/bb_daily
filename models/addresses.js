const Sequelize = require('sequelize');
const Customer = require('./customers');
const Address = sequelize.define('addresses', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV1,
  },
  customer_id: {
    type: Sequelize.UUID,
    references: {
      model: 'customers',
      key: 'id',
    },
    allowNull: false,
  },
  locality_id: {
    type: Sequelize.UUID,
    references: {
      model: 'localities',
      key: 'id',
    },
    allowNull: false,
  },
  sub_locality_id: {
    type: Sequelize.UUID,
    references: {
      model: 'sub_localities',
      key: 'id',
    },
    allowNull: true,
  },
  sub_locality_name: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  house_number: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdAt: {
    field: 'created_at',
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false,
  },
  updatedAt: {
    field: 'updated_at',
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false,
  },
});

Customer.Address = Customer.hasOne(Address, {
  as: 'Address',
  foreignKey: 'customer_id',
});

Address.Customer = Address.belongsTo(Customer, {
  onDelete: 'CASCADE',
  hooks: true,
  as: 'Customer',
  foreignKey: 'customer_id',
});

module.exports = Address;
