const Sequelize = require('sequelize');
const Delivery_agent = require('./delivery_agents');
const Subscription = require('./subscriptions');
const Group = sequelize.define('groups', {
  id: {
    type: Sequelize.DataTypes.UUID,
    defaultValue: Sequelize.literal('uuid_generate_v4()'),
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  delivery_agent_id: {
    type: Sequelize.UUID,
    references: {
      model: 'delivery_agents',
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

Delivery_agent.Group = Delivery_agent.hasMany(Group, {
  as: 'Group',
  foreignKey: 'delivery_agent_id'
});

Group.Delivery_agent = Group.belongsTo(Delivery_agent, {
  as: 'Delivery_agent',
  foreignKey: 'delivery_agent_id'
});

Group.Subscription = Group.hasMany(Subscription, {
  as: 'Subscription',
  foreignKey: 'group_id'
});

Subscription.Group = Subscription.belongsTo(Group, {
  as: 'Group',
  foreignKey: 'group_id'
});

module.exports = Group;
