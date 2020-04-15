const Sequelize = require('sequelize');
const Product = require('./products');
const Subscription = sequelize.define('subscriptions', {
  id: {
    type: Sequelize.DataTypes.UUID,
    defaultValue: Sequelize.literal('uuid_generate_v4()'),
    primaryKey: true
  },
  product_id: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  customer_id: {
    type: Sequelize.UUID,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  frequency_type: {
    type: Sequelize.ENUM(
      'daily',
      'weekdays',
      'alternate_day',
      'thirdday',
      'weekly'
    ),
    allowNull: false
  },
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('pending', 'active', 'paused', 'rejected', 'deleted'),
    allowNull: false
  },
  pause_start_on: {
    type: Sequelize.DATE,
    allowNull: true
  },
  pause_end_on: {
    type: Sequelize.DATE,
    allowNull: true
  },
  group_id: {
    type: Sequelize.UUID,
    references: {
      model: 'groups',
      key: 'id'
    },
    allowNull: true
  },
  createdAt: {
    field: 'created_at',
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false
  },
  updatedAt: {
    field: 'updated_at',
    type: 'TIMESTAMP',
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    allowNull: false
  }
});

Product.Subscription = Product.hasMany(Subscription, {
  as: 'Subscription',
  foreignKey: 'product_id'
});

Subscription.Product = Subscription.belongsTo(Product, {
  as: 'Product',
  foreignKey: 'product_id'
});

module.exports = Subscription;
