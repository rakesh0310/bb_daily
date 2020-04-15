const jwt = require('jsonwebtoken');
const Session = require('../models/sessions');
const Customer = require('../models/customers');
const Admin = require('../models/admin');
const Delivery_agent = require('../models/delivery_agents');

auth = req => {
  return new Promise((resolve, reject) => {
    try {
      jwt.verify(
        req.headers['access-token'],
        process.env.SECRET,
        (error, payload) => {
          if (error) {
            reject(error);
          } else {
            resolve(payload && payload.session_id);
          }
        }
      );
    } catch (error) {
      reject(new Error('Invalid Payload'));
    }
  })
    .then(session_id => {
      if (!session_id) {
        throw new Error('Invalid Session');
      }

      return Session.findOne({
        where: { id: session_id }
      });
    })
    .then(session => {
      if (!session) {
        throw new Error('Invalid Session');
      } else {
        return session;
      }
    });
};

module.exports.customer = (req, res, next) => {
  auth(req)
    .then(session => {
      if (session.user_type !== 'customer') {
        throw new Error('Invalid Session');
      }
      req.current_session = session;
      return session.user_id;
    })
    .then(customer_id => {
      return Customer.findOne({
        where: { id: customer_id }
      });
    })
    .then(customer => {
      if (!customer) {
        throw new Error('Invalid Session');
      }
      req.current_customer = customer;
      next();
    })
    .catch(error =>
      res
        .status(401)
        .send({ errors: [{ message: error.message || 'Invalid Session' }] })
    );
};

module.exports.admin = (req, res, next) => {
  auth(req)
    .then(session => {
      if (session.user_type !== 'admin') {
        throw new Error('Invalid Session');
      }
      req.current_session = session;
      return session.user_id;
    })
    .then(admin_id => {
      return Admin.findOne({
        where: { id: admin_id }
      });
    })
    .then(admin => {
      if (!admin) {
        throw new Error('Invalid Session');
      }
      req.current_admin = admin;
      next();
    })
    .catch(error =>
      res
        .status(401)
        .send({ errors: [{ message: error.message || 'Invalid Session' }] })
    );
};

module.exports.delivery_agent = (req, res, next) => {
  auth(req)
    .then(session => {
      if (session.user_type !== 'delivery_agent') {
        throw new Error('Invalid Session');
      }
      req.current_session = session;
      return session.user_id;
    })
    .then(delivery_agent_id => {
      return Delivery_agent.findOne({
        where: { id: delivery_agent_id }
      });
    })
    .then(delivery_agent => {
      if (!delivery_agent) {
        throw new Error('Invalid Session');
      }
      req.current_delivery_agent = delivery_agent;
      next();
    })
    .catch(error =>
      res
        .status(401)
        .send({ errors: [{ message: error.message || 'Invalid Session' }] })
    );
};