'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('delivery_agents', 'name', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('delivery_agents', 'name', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
