'use strict';

module.exports = {
  up: function up(queryInterface, Sequelize) {
    return queryInterface.renameColumn(
      'groups',
      'deliver_agent_id',
      'delivery_agent_id'
    );
  },
  down: function down(queryInterface, Sequelize) {
    return queryInterface.renameColumn(
      'groups',
      'delivery_agent_id',
      'deliver_agent_id'
    );
  },
};
