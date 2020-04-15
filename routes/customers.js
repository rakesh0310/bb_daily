const express = require('express');
const router = express.Router();
const Customer = require('../models/customers');
const Session = require('../models/sessions');
const Address = require('../models/addresses');
const Locality = require('../models/localities');
const Sub_locality = require('../models/sub_localities');
const jwt = require('jsonwebtoken');
const auth = require('../lib/auth');
const OTP = require('../lib/otp');
require('dotenv').config();

router.post('/auth/new', (req, res) => {
  const { phone } = req.body;

  if (!phone || phone.length !== 10) {
    res.status(400).json({ errors: [{ message: 'Invalid Phone Number' }] });
  } else {
    return OTP.send(phone)
      .then((otp) => {
        res.status(200).json({
          data: {
            otp: {
              id: otp.id,
              expires_at: otp.expires_at,
              retry_count: otp.retry_count,
            },
          },
        });
      })
      .catch((error) => {
        res.status(400).json({ errors: [{ message: error.message }] });
      });
  }
});

router.post('/auth/resend_otp', (req, res) => {
  const { otp_id, phone } = req.body;

  return OTP.send(phone, otp_id)
    .then((otp) => {
      res.status(200).json({
        data: {
          otp: {
            id: otp.id,
            expires_at: otp.expires_at,
            retry_count: otp.retry_count,
          },
        },
      });
    })
    .catch((error) => {
      res.status(400).json({ errors: [{ message: error.message }] });
    });
});

router.post('/auth/verify', (req, res) => {
  const { otp, otp_id } = req.body;

  OTP.verify(otp_id, otp)
    .then(async (phone) => {
      let customer = await Customer.findOne({
        where: { phone },
      });
      if (!customer) {
        customer = await Customer.create({ phone });
      }
      return customer;
    })
    .then(async (customer) => {
      const expiry = new Date(
        Date.now() + process.env.SESSION_EXPIRE_TIME * 60 * 60 * 1000
      );
      const session = await Session.create({
        expires_at: expiry,
        user_type: 'customer',
        user_id: customer.id,
      });

      const token = jwt.sign({ session_id: session.id }, process.env.SECRET, {
        expiresIn: `${process.env.SESSION_EXPIRE_TIME}h`,
      });
      return { customer, token };
    })
    .then(({ customer, token }) => {
      res.setHeader('access-token', token);
      if (customer.name) {
        res.status(200).json({
          data: {
            customer: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
            },
            is_new_user: false,
          },
        });
      } else {
        res.status(200).json({
          data: {
            customer: {
              id: customer.id,
              name: customer.name,
              email: customer.email,
            },
            is_new_user: true,
          },
        });
      }
    })
    .catch((error) => {
      res
        .status(401)
        .json({ errors: [{ message: error.message || 'Auth Failed' }] });
    });
});

router.delete('/auth', auth.customer, (req, res) => {
  const session_id = req.current_session.id;
  Session.destroy({
    where: { id: session_id },
  })
    .then(() => res.status(200).json({}))
    .catch((error) =>
      res.status(400).json({ errors: [{ message: 'Invalid Session' }] })
    );
});

router.get('/me', auth.customer, async (req, res) => {
  const customer = req.current_customer;

  Address.findOne({ where: { customer_id: customer.id } }).then(
    async (address) => {
      let address_object = null;
      if (address) {
        const locality = await Locality.findOne({
          where: { id: address.locality_id },
        });
        address_object = {};
        address_object.locality = {};
        address_object.sub_locality = {};
        address_object.id = address.id;
        address_object.locality.id = locality.id;
        address_object.locality.name = locality.name;
        address_object.sub_locality.id = address.sub_locality_id;
        address_object.sub_locality.name = address.sub_locality_name;
        address_object.house_number = address.house_number;
      }
      res.status(200).json({
        data: {
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
          address: address_object,
        },
      });
    }
  );
});

router.patch('/me', auth.customer, async (req, res) => {
  const { name, email } = req.body;
  const emailRegexp = /^([!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64}(\.[!#-\'*+\/-9=?A-Z^-~\\\\-]{1,64})*|"([\]!#-[^-~\ \t\@\\\\]|(\\[\t\ -~]))+")@([0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?(\.[0-9A-Z]([0-9A-Z-]{0,61}[0-9A-Za-z])?))+$/i;
  const nameRegexp = /^[a-zA-Z][A-Za-z0-9_]*$/;
  if (email && !emailRegexp.test(email)) {
    res.status(400).json({ errors: [{ message: 'Email Address is Invalid' }] });
  } else if (name && !nameRegexp.test(name)) {
    res
      .status(400)
      .json({ errors: [{ message: 'Name must be start with a character' }] });
  } else {
    const customer = req.current_customer;
    if (name) customer.name = name;
    if (email) customer.email = email;
    await customer.save();
    console.log(customer.get());
    res.status(200).json({
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      },
    });
  }
});

router.get('/address', auth.customer, (req, res) => {
  const customer = req.current_customer;
  Address.findOne({
    where: { customer_id: customer.id },
  })
    .then(async (address) => {
      let address_object = null;
      if (address) {
        const locality = await Locality.findOne({
          where: { id: address.locality_id },
        });
        address_object = {};
        address_object.locality = {};
        address_object.sub_locality = {};
        address_object.id = address.id;
        address_object.locality.id = locality.id;
        address_object.locality.name = locality.name;
        address_object.sub_locality.id = address.sub_locality_id;
        address_object.sub_locality.name = address.sub_locality_name;
        address_object.house_number = address.house_number;
      }
      res.status(200).json({
        data: {
          address: address_object,
        },
      });
    })
    .catch((error) =>
      res
        .status(404)
        .json({ errors: [{ message: error.message || 'Addres not found' }] })
    );
});

router.post('/address', auth.customer, async (req, res) => {
  const customer_id = req.current_customer.id;
  let {
    locality_id,
    sub_locality_name,
    sub_locality_id,
    house_number,
  } = req.body;
  if (!(sub_locality_id || sub_locality_name)) {
    res.status(400).json({
      errors: [{ message: 'Either Sub_locality id or name must be present' }],
    });
  } else if (!locality_id) {
    res
      .status(400)
      .json({ errors: [{ message: 'Locality id must be present' }] });
  } else if (!house_number) {
    res
      .status(400)
      .json({ errors: [{ message: 'House no. must be present' }] });
  } else {
    const locality = await Locality.findOne({
      where: { id: locality_id },
    });
    if (sub_locality_id) {
      const sub_locality = await Sub_locality.findOne({
        where: { id: sub_locality_id },
      });
      sub_locality_name = sub_locality.name;
    }
    Address.findOne({ where: { customer_id } }).then(async (address) => {
      if (address) {
        address.locality_id = locality_id;
        address.sub_locality_name = sub_locality_name;
        address.sub_locality_id = sub_locality_id;
        address.house_number = house_number;
        await address.save();
      } else {
        address = await Address.create({
          customer_id,
          locality_id,
          sub_locality_id,
          sub_locality_name,
          house_number,
        });
      }
      res.status(200).json({
        data: {
          address: {
            id: address.id,
            locality: {
              id: locality.id,
              name: locality.name,
            },
            sub_locality: {
              id: address.sub_locality_id,
              name: address.sub_locality_name,
            },
            house_number: address.house_number,
          },
        },
      });
    });
  }
});
module.exports = router;
