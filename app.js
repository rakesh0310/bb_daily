const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config({ path: process.env.DOTENV_PATH });
const port = process.env.PORT;
var cors = require('cors');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var corsOptions = {
  origin: (origin, callback) => callback(null, true),
  methods: 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
  credentials: true,
  exposedHeaders: 'access-token'
};
app.use(cors(corsOptions)); // This is CORS-enabled for all origins

require('./database/connection')
  .authenticate()
  .then(() => console.log('Connected'));

app.use('/customers', require('./routes/customers'));
app.use('/products', require('./routes/products'));
app.use('/localities', require('./routes/localities'));
app.use('/admin', require('./routes/admin'));
app.use('/subscriptions', require('./routes/subscriptions'));
app.use('/delivery_agents', require('./routes/delivery_agents'));

app.listen(port, () => {
  console.log(`server running on the ${port}`);
});
