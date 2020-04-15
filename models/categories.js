const Sequelize = require('sequelize');
const Product = require('./products');

const Category = sequelize.define('categories', {
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
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  image_url: {
    type: Sequelize.TEXT,
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

Category.Product = Category.hasMany(Product, {
  as: 'Product',
  foreignKey: 'category_id',
});

Product.Category = Product.belongsTo(Category, {
  as: 'Category',
  foreignKey: 'category_id',
});

module.exports = Category;
