const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const Session = require('../models/sessions');
const jwt = require('jsonwebtoken');
const Subscription = require('../models/subscriptions');
const Product = require('../models/products');
const Group = require('../models/groups');
const Delivery_agents = require('../models/delivery_agents');
const Delivery_agent = require('../models/delivery_agents');
const auth = require('../lib/auth');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const Cities = require('../models/cities');
const Localities = require('../models/localities');
const Customers = require('../models/customers');
const Category = require('../models/categories');
const Sub_locality = require('../models/sub_localities');
require('dotenv').config();

router.post('/auth', async (req, res) => {
  const { email, password, name } = req.body;
  const emailRegexp = /^([!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64}(\.[!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64})*|"([\]!#-[^-~\ \t\@\\\\]|(\\[\t\ -~]))+")@([0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?(\.[0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?))+$/i;
  if (!emailRegexp.test(email)) {
    res.status(400).send('Error: Email Address is Invalid');
  } else {
    const admin = await Admin.findOne({
      where: { email: email },
    });
    if (admin && admin.email == email && admin.password == password) {
      const expiry = new Date(
        Date.now() + process.env.SESSION_EXPIRE_TIME * 60 * 60 * 1000
      );

      const session = await Session.create({
        expires_at: expiry,
        user_type: 'admin',
        user_id: admin.id,
      });

      const token = jwt.sign({ session_id: session.id }, process.env.SECRET, {
        expiresIn: `${process.env.SESSION_EXPIRE_TIME}h`,
      });
      res.setHeader('access-token', token);

      res.status(200).json({
        data: {
          admin: {
            name: admin.name,
            email: admin.email,
          },
        },
      });
    } else {
      res.status(400).json({
        errors: [{ message: 'Email and Passwords are incorrect' }],
      });
    }
  }
});

router.delete('/auth', auth.admin, (req, res) => {
  const session_id = req.current_session.id;
  Session.destroy({
    where: { id: session_id },
  })
    .then(() => res.status(200).json({}))
    .catch((error) =>
      res.status(400).json({ errors: [{ message: 'Invalid Session' }] })
    );
});

router.get('/subscriptions', auth.admin, (req, res) => {
  let { page, per_page, product_id, customer_id, group_id } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 3;
  let where = {};
  if (customer_id) where.customer_id = customer_id;
  if (product_id) where.product_id = product_id;
  if (group_id) where.group_id = group_id;
  Subscription.findAll({
    attributes: ['id', 'frequency_type', 'quantity', 'status'],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
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
        data: {
          subscriptions: [subscriptions],
        },
      });
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message }],
      })
    );
});

router.post('/subscriptions', auth.admin, (req, res) => {
  const {
    frequency_type,
    quantity,
    status,
    group_id,
    product_id,
    customer_id,
  } = req.body;
  let subscription = {
    customer_id,
    product_id,
    frequency_type,
    quantity,
    status,
  };
  if (group_id) subscription.group_id = group_id;
  Subscription.create(subscription)
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
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.patch('/subscriptions/:id', auth.admin, (req, res) => {
  const {
    frequency_type,
    quantity,
    status,
    pause_start_on,
    pause_end_on,
    group_id,
    product_id,
    customer_id,
  } = req.body;
  if (status === 'paused' && !(pause_start_date && pause_end_date))
    res
      .status(400)
      .json({ errors: [{ message: 'Must Include date for pause' }] });
  // If status is paused start and end date must include
  Subscription.findOne({ where: { id: req.params.id } })
    .then(async (subscription) => {
      if (!subscription) {
        throw new Error('Invalid Subscription Id');
      }
      if (frequency_type) subscription.frequency_type = frequency_type;
      if (quantity) subscription.quantity = quantity;
      if (status) subscription.status = status;
      if (pause_start_on) subscription.pause_start_on = pause_start_date;
      if (pause_end_on) subscription.pause_end_on = pause_end_date;
      if (group_id) subscription.group_id = group_id;
      if (customer_id) subscription.customer_id = customer_id;
      if (product_id) subscription.product_id = product_id;
      await subscription.save();
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
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.delete('/subscriptions/:id', auth.admin, (req, res) => {
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
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.get('/groups', auth.admin, (req, res) => {
  let { page, per_page, delivery_agent_id, query } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 20;
  let where = {};
  if (delivery_agent_id) where.delivery_agent_id = delivery_agent_id;
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  Group.findAll({
    attributes: ['id', 'name'],
    include: [
      {
        model: Subscription,
        as: 'Subscription',
      },
      {
        model: Delivery_agent,
        as: 'Delivery_agent',
        attributes: ['id', 'name'],
      },
    ],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
    order: [['id', 'ASC']],
  })
    .then(async (groups) => {
      result_groups = groups.map((group) => {
        return {
          ...group.get(),
          subscriptions_count: group.Subscription.length, //number of subscriptions related to group
          Subscription: undefined, //remove subscription
        };
      });
      res.status(200).json({
        data: {
          groups: result_groups,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message }],
      })
    );
});

router.post('/groups', auth.admin, (req, res) => {
  const { name, delivery_agent_id } = req.body;
  let group = { name };
  if (delivery_agent_id) group.delivery_agent_id = delivery_agent_id;
  Group.create(group)
    .then((group) => {
      Delivery_agent.findOne({
        where: { id: group.delivery_agent_id },
        attributes: ['id', 'name'],
      }).then((delivery_agent) =>
        res.status(200).json({
          data: {
            group: {
              id: group.id,
              name: group.name,
              delivery_agent: delivery_agent,
              subscriptions_count: 0,
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

router.patch('/groups/:id', auth.admin, (req, res) => {
  const { name, delivery_agent_id } = req.body;

  Group.findOne({
    include: [
      {
        model: Subscription,
        as: 'Subscription',
      },
    ],
    where: { id: req.params.id },
  })
    .then(async (group) => {
      if (!group) {
        throw new Error('Invalid Group Id');
      }
      if (name) group.name = name;
      if (delivery_agent_id) group.delivery_agent_id = delivery_agent_id;
      await group.save();
      Delivery_agent.findOne({
        where: { id: group.delivery_agent_id },
        attributes: ['id', 'name'],
      }).then((delivery_agent) => {
        group.subscriptions_count = group.Subscription.length;
        group.Subscription = undefined;
        res.status(200).json({
          data: {
            group: {
              id: group.id,
              name: group.name,
              delivery_agent: delivery_agent,
              subscriptions_count: group.subscriptions_count,
            },
          },
        });
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.delete('/groups/:id', auth.admin, (req, res) => {
  Group.findOne({
    where: { id: req.params.id },
  })
    .then((group) => {
      if (!group) {
        throw new Error('Invalid Group Id');
      }
      group.destroy().then(() => res.status(200).json());
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.get('/products', auth.admin, (req, res) => {
  let { query, category_id, page, per_page } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 3;
  let where = {};
  if (query) {
    where.category_id = category_id;
  }
  Product.findAll({
    attributes: [
      'id',
      'name',
      'price_cents',
      'category_id',
      'description',
      'image_url',
      'status',
    ],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          products: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.post('/products', auth.admin, async (req, res) => {
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
          products: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.patch('/products/:id', auth.admin, async (req, res) => {
  const {
    name,
    price_cents,
    category_id,
    description,
    image_url,
    status,
  } = req.body;
  //const product = await Product.findOne({ where: { id: req.params.id } });
  product = await Product.findOne({ where: { id: req.params.id } });
  if (!product) {
    res.status(400).json({ errors: [{ message: 'Id does not exist' }] });
  } else {
    product = await Product.update(
      {
        name: name,
        price_cents: price_cents,
        category_id: category_id,
        description: description,
        image_url: image_url,
        status: status,
      },
      { where: { id: req.params.id }, returning: true }
    )
      .then((result) => {
        res.status(200).json({
          data: {
            products: result,
          },
        });
      })
      .catch((error) =>
        res.status(400).json({ error: [{ message: error.message }] })
      );
  }
});

router.delete('/products/:id', auth.admin, async (req, res) => {
  Product.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then(function (deletedRecord) {
      if (deletedRecord === 1) {
        res.status(200).json({ message: 'Deleted successfully' });
      } else {
        res.status(404).json({ message: 'Record not found' });
      }
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.get('/cities', auth.admin, (req, res) => {
  let { query, page, per_page } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 3;
  let where = {};
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  Cities.findAll({
    attributes: ['id', 'name'],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          cities: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.post('/cities', auth.admin, async (req, res) => {
  const { name } = req.body;
  await Cities.create({
    name,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          cities: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.patch('/cities/:id', auth.admin, async (req, res) => {
  const { name } = req.body;
  city = await Cities.findOne({ where: { id: req.params.id } });
  if (!city) {
    res.status(400).json({ errors: [{ message: 'Id does not exist' }] });
  } else {
    city = await Cities.update(
      {
        name: name,
      },
      { where: { id: req.params.id }, returning: true }
    )
      .then((result) => {
        res.status(200).json({
          data: {
            cities: result,
          },
        });
      })
      .catch((error) =>
        res.status(400).json({ errors: [{ message: error.message }] })
      );
  }
});

router.delete('/cities/:id', auth.admin, async (req, res) => {
  Cities.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then(function (deletedRecord) {
      if (deletedRecord === 1) {
        res.status(200).json({ message: 'Deleted successfully' });
      } else {
        res.status(404).json({ message: 'Record not found' });
      }
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.get('/localities', auth.admin, (req, res) => {
  let { query, city_id, page, per_page } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 3;
  let where = {};
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  if (city_id) where.city_id = city_id;
  Localities.findAll({
    attributes: ['id', 'city_id', 'name'],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          localities: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.post('/localities', auth.admin, async (req, res) => {
  const { name, city_id } = req.body;
  const city = await Cities.findOne({
    where: { id: city_id },
  });
  if (!city) {
    res.status(400).json({ errors: [{ message: 'City Id does not exist' }] });
  } else {
    await Localities.create({
      name,
      city_id,
    })
      .then((result) => {
        res.status(200).json({
          data: {
            localities: result,
          },
        });
      })
      .catch((error) =>
        res.status(400).json({ errors: [{ message: error.message }] })
      );
  }
});

router.patch('/localities/:id', auth.admin, async (req, res) => {
  const { name, city_id } = req.body;
  locality = await Localities.findOne({ where: { id: req.params.id } });
  if (!locality) {
    res.status(400).json({ errors: [{ message: 'Id does not exist' }] });
  } else {
    const city = await Cities.findOne({
      where: { id: city_id },
    });
    if (!city) {
      res.status(400).json({ errors: [{ message: 'City Id does not exist' }] });
    } else {
      locality = await Localities.update(
        {
          name: name,
          city_id: city_id,
        },
        { where: { id: req.params.id }, returning: true }
      )
        .then((result) => {
          res.status(200).json({
            data: {
              localities: result,
            },
          });
        })
        .catch((error) =>
          res.status(400).json({ errors: [{ message: error.message }] })
        );
    }
  }
});

router.delete('/localities/:id', auth.admin, async (req, res) => {
  Localities.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then(function (deletedRecord) {
      if (deletedRecord === 1) {
        res.status(200).json({ message: 'Deleted successfully' });
      } else {
        res.status(404).json({ message: 'Record not found' });
      }
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.get('/delivery_agents', auth.admin, (req, res) => {
  let { query, page, per_page } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 100;
  let where = {};
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  Delivery_agents.findAll({
    attributes: ['id', 'name', 'phone'],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          delivery_agents: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.post('/delivery_agents', auth.admin, async (req, res) => {
  const { name, phone } = req.body;
  const delivery_agents = await Delivery_agents.findOne({
    where: { phone: phone },
  });
  if (!delivery_agents) {
    await Delivery_agents.create({
      name,
      phone,
    })
      .then((result) => {
        res.status(200).json({
          data: {
            delivery_agents: result,
          },
        });
      })
      .catch((error) =>
        res.status(400).json({ errors: [{ message: error.message }] })
      );
  } else {
    res
      .status(400)
      .json({ error: [{ message: error.message || 'Phone already exist' }] });
  }
});

router.patch('/delivery_agents/:id', auth.admin, async (req, res) => {
  const { name, phone } = req.body;
  delivery_agents = await Delivery_agents.findOne({
    where: { id: req.params.id },
  });
  if (!delivery_agents) {
    res.status(400).json({ errors: [{ message: 'Id not exist' }] });
  } else {
    delivery_agents = await Delivery_agents.update(
      {
        name: name,
        phone: phone,
      },
      { where: { id: req.params.id }, returning: true }
    )
      .then((result) => {
        res.status(200).json({
          data: {
            delivery_agents: result,
          },
        });
      })
      .catch((error) =>
        res.status(400).json({ errors: [{ message: error.message }] })
      );
  }
});

router.delete('/delivery_agents/:id', auth.admin, async (req, res) => {
  Delivery_agents.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then(function (deletedRecord) {
      if (deletedRecord === 1) {
        res.status(200).json({ message: 'Deleted successfully' });
      } else {
        res.status(404).json({ message: 'Record not found' });
      }
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.get('/customers', auth.admin, (req, res) => {
  let { query, page, per_page } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 3;
  let where = {};
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  Customers.findAll({
    attributes: ['id', 'name', 'phone', 'email'],
    where,
    limit: per_page,
    offset: (page - 1) * per_page,
  })
    .then((result) => {
      res.status(200).json({
        data: {
          customers: result,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.patch('/customers/:id', auth.admin, async (req, res) => {
  const { name, phone, email } = req.body;
  const emailRegexp = /^([!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64}(\.[!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64})*|"([\]!#-[^-~\ \t\@\\\\]|(\\[\t\ -~]))+")@([0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?(\.[0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?))+$/i;
  const nameRegexp = /^[a-zA-Z][A-Za-z0-9_]*$/;
  customers = await Customers.findOne({ where: { id: req.params.id } });
  if (!customers) {
    res.status(400).json({ errors: [{ message: 'Id not exist' }] });
  } else {
    if (email && !emailRegexp.test(email)) {
      res
        .status(400)
        .json({ errors: [{ message: 'Error: Email Address is Invalid' }] });
    } else if (name && !nameRegexp.test(name)) {
      res.status(400).json({
        errors: [{ message: 'Error: Name must be start with a character' }],
      });
    } else {
      const cust_email = await Customers.findOne({
        where: { email: email },
      });
      if (cust_email) {
        res
          .status(400)
          .json({ errors: [{ message: 'email should be unique' }] });
      } else {
        customers = await Customers.update(
          {
            name: name,
            email: email,
          },
          { where: { id: req.params.id }, returning: true }
        )
          .then((result) => {
            res.status(200).json({
              data: {
                customers: result,
              },
            });
          })
          .catch((error) =>
            res.status(400).json({ errors: [{ message: error.message }] })
          );
      }
    }
  }
});

router.delete(
  '/customers/:id',
  /*auth.admin,*/ async (req, res) => {
    Customers.destroy({
      where: {
        id: req.params.id,
      },
    })
      .then(function (deletedRecord) {
        if (deletedRecord === 1) {
          res.status(200).json({ message: 'Deleted successfully' });
        } else {
          res.status(404).json({ message: 'Record not found' });
        }
      })
      .catch((error) =>
        res.status(400).json({ errors: [{ message: error.message }] })
      );
  }
);

router.get('/categories', auth.admin, async (req, res) => {
  let { page, per_page, category, query } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 20;
  let where = {};
  if (category) where.name = category;
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  Category.findAll({
    attributes: ['id', 'name', 'description', 'image_url'],
    where,
    include: [{ model: Product, as: 'Product', attributes: ['id', 'name'] }],
    limit: per_page,
    offset: (page - 1) * per_page,
    order: [['id', 'ASC']],
  })
    .then(async (categories) => {
      result_categories = categories.map((category) => {
        return {
          ...category.get(),
          products_count: category.Product.length,
          Product: undefined,
        };
      });
      res.status(200).json({
        data: {
          categories: result_categories,
        },
      });
    })
    .catch((error) =>
      res.status(400).json({
        errors: [{ message: error.message }],
      })
    );
});

router.post('/categories', auth.admin, (req, res) => {
  const { name, description, image_url } = req.body;
  Category.create({ name, description, image_url })
    .then((category) => {
      res.status(200).json({
        data: {
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
            image_url: category.image_url,
            products_count: 0,
          },
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.patch('/categories/:id', auth.admin, (req, res) => {
  const { name, description, image_url } = req.body;
  Category.findOne({
    where: { id: req.params.id },
    include: { model: Product, as: 'Product', attributes: ['id', 'name'] },
  })
    .then(async (category) => {
      if (!category) {
        throw new Error('Invalid Id');
      }
      if (name) category.name = name;
      if (description) category.description = description;
      if (image_url) category.image_url = image_url;
      await category.save();

      res.status(200).json({
        data: {
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
            image_url: category.image_url,
            products_count: category.Product.length,
          },
        },
      });
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});

router.delete('/categories/:id', auth.admin, (req, res) => {
  id = req.params.id;
  Category.findOne({
    where: { id },
    include: { model: Product, as: 'Product', attributes: ['id'] },
  })
    .then(async (category) => {
      if (!category) {
        throw new Error('Invalid Id');
      }
      if (category.Product.length !== 0) {
        throw new Error('Products Exist in this category');
      }
      await category.destroy({ where: { id } }).then(res.status(200).json());
    })
    .catch((error) =>
      res.status(400).json({ errors: [{ message: error.message }] })
    );
});
/*
router.get('/sub_localities', (req, res) => {
  let { page, per_page, locality_id, query } = req.query;
  const errors = validate(page, per_page);
  if (errors.length) {
    return res.status(400).json({
      errors,
    });
  }
  if (!page) page = 1;
  if (!per_page) per_page = 20;
  let where = {};
  if (locality_id) where.locality_id = locality_id;
  if (query) {
    where.name = { [Op.iLike]: `%${query}%` };
  }
  Sub_locality.findAll({attributes:[[]]})
});*/
validate = (page, per_page) => {
  let errors = [];
  if (page) {
    if (!isNaN(page)) {
      page = parseInt(page);
      if (page <= 0) errors.push({ message: 'Invalid page parameter' });
    } else {
      errors.push({ message: 'Invalid page parameter' });
    }
  }
  if (per_page) {
    if (!isNaN(per_page)) {
      per_page = parseInt(per_page);
      if (per_page <= 0) errors.push({ message: 'Invalid page parameter' });
    } else {
      errors.push({ message: 'Invalid page parameter' });
    }
  }
  return errors;
};

module.exports = router;
