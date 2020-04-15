const Sequelize = require('sequelize');

module.exports = sequelize.define('localities', {
  id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.DataTypes.UUID,
    defaultValue: Sequelize.literal('uuid_generate_v4()'),
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  city_id: {
    type: Sequelize.UUID,
    references: {
      model: 'cities',
      key: 'id'
    }
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
