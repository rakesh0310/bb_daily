module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'products',
      'status',
      {
        type: Sequelize.ENUM('enabled', 'disabled')
      }
    );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn(
      'products',
      'status'
    );
  }
}