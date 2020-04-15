'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('products', 'category').then(
      queryInterface.addColumn('products', 'category_id', {
        type: Sequelize.UUID,
        references: {
          model: 'categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
      })
    );
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('products', 'category_id'),
      queryInterface.addColumn('products', 'category', {
        type: Sequelize.STRING,
      }),
    ]);
  },
};
