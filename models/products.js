const Sequelize = require('sequelize');

module.exports = sequelize.define('products', {
  id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.DataTypes.UUID,
    defaultValue: Sequelize.literal('uuid_generate_v4()'),
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },

  price_cents: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },

  category_id: {
    type: Sequelize.UUID,
    references: {
      model: 'categories',
      key: 'id',
    },
  },

  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  image_url: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM('enabled', 'disabled'),
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
