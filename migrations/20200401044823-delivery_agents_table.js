'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('delivery_agents', { 
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV1
        },
        name: {
          type: Sequelize.STRING,
          allowNull: true
        },
        phone: {
          type: Sequelize.STRING(10),
          allowNull: false,
          unique: true
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

  },
  
  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('delivery_agents');
  }
};
