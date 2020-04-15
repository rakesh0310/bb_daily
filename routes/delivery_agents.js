const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../lib/auth');
const Session = require('../models/sessions');
const OTP = require('../lib/otp');
const Delivery_agent = require('../models/delivery_agents');
const Groups = require('../models/groups');
const Subscriptions = require('../models/subscriptions');
const Products = require('../models/products');
const Customers = require('../models/customers');
require('dotenv').config();

router.post('/auth/new', (req, res) => {
    const { phone } = req.body;
  
    if (!phone || phone.length !== 10) {
      res.status(400).json({ msg: 'Invalid Phone Number' });
    } else {
      return OTP.send(phone)
        .then(otp => {
          res.status(200).json({
            data: {
              otp: {
                id: otp.id,
                expires_at: otp.expires_at,
                retry_count: otp.retry_count
              }
            }
          });
        })
        .catch(error => {
          res.status(400).json({ errors: [{ message: error.message }] });
        });
    }
});

router.post('/auth/verify', (req, res) => {
    const { otp, otp_id } = req.body;
  
    OTP.verify(otp_id, otp)
      .then(async phone => {
        let delivery_agent = await Delivery_agent.findOne({
          where: { phone }
        });
        if (!delivery_agent) {
            delivery_agent = await Delivery_agent.create({ phone });
        }
        return delivery_agent;
    })
    .then(async delivery_agent => {
        const expiry = new Date(
          Date.now() + process.env.SESSION_EXPIRE_TIME * 60 * 60 * 1000
        );
        const session = await Session.create({
          expires_at: expiry,
          user_type: 'delivery_agent',
          user_id: delivery_agent.id
        });
  
        const token = jwt.sign({ session_id: session.id }, process.env.SECRET, {
          expiresIn: `${process.env.SESSION_EXPIRE_TIME}h`
        });
        return { delivery_agent, token };
    })
    .then(({ delivery_agent, token }) => {
        res.setHeader('access-token', token);
      
          res.status(200).json({
            data: {
                delivery_agent: {
                    id: delivery_agent.id,
                    phone: delivery_agent.phone,
                    name: delivery_agent.name
                },
            }
        });
    })
    .catch(error => {
        res
          .status(401)
          .json({ errors: [{ message: error.message || 'Auth Failed' }] });
    });
});

router.delete('/auth', auth.delivery_agent, (req, res) => {
  const session_id = req.current_session.id;
  Session.destroy({
    where: { id: session_id }
  })
    .then(() => res.status(200).json({}))
    .catch(error =>
      res.status(400).json({ errors: [{ message: 'Invalid Session' }] })
    );
});

module.exports = router;