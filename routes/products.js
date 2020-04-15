const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const Category = require('../models/categories');

router.get('/', async (req, res) => {
  const query = {};
  if (req.query.category) {
    query.name = req.query.category;
  }
  Category.findOne({ where: query })
    .then((category) => {
      if (!category) throw new Error("category does'nt exists");
      let where = { status: 'enabled' };
      // if category exists
      if (query.name) {
        where.category_id = category.id;
      }
      Product.findAll({
        attributes: [
          'id',
          'name',
          'price_cents',
          'description',
          'image_url',
          'status',
        ],
        where,
      }).then((result) => {
        res.status(200).json({
          data: {
            products: result,
          },
        });
      });
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message || "products does'nt exists" }],
      })
    );
});

router.get('/categories', (req, res) => {
  Category.findAll({
    attributes: ['id', 'name', 'description', 'image_url'],
  }).then((categories) => {
    res.status(200).json({
      data: {
        categories,
      },
    });
  });
});

router.post('/', async (req, res) => {
  const {
    name,
    price_cents,
    category_id,
    description,
    image_url,
    status,
  } = req.body;
  await Product.create({
    name,
    price_cents,
    category_id,
    description,
    image_url,
    status,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          products: {
            id: result.id,
            name: result.name,
            price_cents: result.price_cents,
            category_id: result.category_id,
            description: result.description,
            image_url: result.image_url,
            status: result.status,
          },
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});
module.exports = router;
