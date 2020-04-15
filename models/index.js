'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(__filename);
var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config/config.js')[env];
var db = {};

if (config.use_env_variable) {
  var sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  var sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
//Associations
db.customers.hasMany(db.sessions);
db.sessions.belongsTo(db.customers);

db.cities.hasMany(db.localities);
db.localities.belongsTo(db.cities);

db.customers.hasOne(db.otps);
db.otps.belongsTo(db.customers);

db.localities.hasMany(db.sub_localities);
db.sub_localities.belongsTo(db.localities);

db.customers.hasOne(db.addresses);
db.addresses.belongsTo(db.customers);

db.localities.hasMany(db.addresses);
db.addresses.belongsTo(db.localities);

db.sub_localities.hasMany(db.addresses);
db.addresses.belongsTo(db.sub_localities);

db.products.hasMany(db.subscriptions);
db.subscriptions.belongsTo(db.products, {
  foreignKey: 'product_id',
  as: 'products'
});

db.customers.hasMany(db.subscriptions);
db.subscriptions.belongsTo(db.customers, {
  foreignKey: 'customer_id',
  as: 'customers'
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
