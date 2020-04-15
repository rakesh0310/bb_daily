const express = require('express');
const router = express.Router();
const Subscription = require('../models/subscriptions');
const Product = require('../models/products');
const auth = require('../lib/auth');
require('dotenv').config();

router.get('/', auth.customer, (req, res) => {
  const customer = req.current_customer;
  Subscription.findAll({
    attributes: ['id', 'frequency_type', 'quantity', 'status'],
    where: { customer_id: customer.id },
    include: [
      {
        model: Product,
        as: 'Product',
        attributes: ['id', 'name', 'price_cents', 'image_url', 'description'],
      },
    ],
  })
    .then((subscriptions) => {
      res.status(200).json({
        subscriptions,
      });
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message }],
      })
    );
});

router.post('/', auth.customer, (req, res) => {
  const customer = req.current_customer;
  const product_id = req.body.product_id;
  const frequency_type = req.body.frequency;
  const status = 'active';
  const quantity = req.body.quantity;
  Subscription.create({
    customer_id: customer.id,
    product_id,
    frequency_type,
    quantity,
    status,
  })
    .then((subscription) => {
      Product.findOne({
        where: { id: subscription.product_id },
        attributes: ['id', 'name', 'price_cents', 'image_url', 'description'],
      }).then((product) =>
        res.status(200).json({
          data: {
            subscription: {
              id: subscription.id,
              product: product,
              frequency_type: subscription.frequency_type,
              quantity: subscription.quantity,
              status: subscription.status,
            },
          },
        })
      );
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message }],
      })
    );
});
router.post('/:id/status', auth.customer, (req, res) => {
  const { status, pause_start_date, pause_end_date } = req.body;
  if (status === 'paused' && !(pause_start_date && pause_end_date)) {
    res.status(400).json({ error: 'Must Include date' });
  } else {
    Subscription.findOne({
      attributes: ['id', 'frequency_type', 'quantity'],
      where: { id: req.params.id },
      include: [
        {
          model: Product,
          as: 'Product',
          attributes: ['id', 'name', 'price_cents', 'image_url', 'description'],
        },
      ],
    })
      .then(async (subscription) => {
        if (!subscription) {
          throw new Error('Invalid Subscription Id');
        }
        subscription.status = status;
        subscription.pause_start_date = pause_start_date;
        subscription.pause_end_date = pause_end_date;
        await subscription.save();
        res.status(200).json({
          data: {
            subscription: {
              id: subscription.id,
              product: subscription.Product,
              frequency_type: subscription.frequency_type,
              quantity: subscription.quantity,
              status: subscription.status,
            },
          },
        });
      })
      .catch((error) =>
        res.status(400).json({
          errors: [{ message: error.message }],
        })
      );
  }
});

router.delete('/:id', auth.customer, (req, res) => {
  Subscription.findOne({
    where: { id: req.params.id },
  })
    .then((subscription) => {
      if (!subscription) {
        throw new Error('Invalid Subscription Id');
      }
      subscription.destroy().then(() => res.status(200).json());
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message }],
      })
    );
});

module.exports = router;
