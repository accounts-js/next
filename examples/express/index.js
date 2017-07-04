const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const Grant = require('grant-express');
const { AccountsServer } = require('@accounts/server');
const { AccountsPassword } = require('@accounts/password');
const { AccountsOauth } = require('@accounts/oauth');
const { accountsExpress, authMiddleware } = require('@accounts/express');
const MongoDBInterface = require('@accounts/mongo').default;
const dotenv = require('dotenv');

dotenv.config();

const grantConfig = {
  "server": {
    "protocol": "http",
    "host": "localhost:3000"
  },
  "facebook": {
    "key": process.env.FACEBOOK_KEY,
    "secret": process.env.FACEBOOK_SECRET,
    "callback": "/accounts/oauth/facebook/callback",
  },
};

const grant = new Grant(grantConfig);

const app = express();

mongoose.connect('mongodb://localhost:27017/js-accounts-rest-example2');
const db = mongoose.connection;

const accountsServer = new AccountsServer({
  password: new AccountsPassword(),
  oauth: new AccountsOauth(grantConfig)
}, {
  db: new MongoDBInterface(db)
});

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(accountsExpress(accountsServer));
app.use(grant);

app.get('/', authMiddleware(accountsServer), (req, res) => {
  if (req.userId) {
    res.json({ message: 'Logged in' });
  } else {
    res.json({ message: 'not logged in' });
  }
});

app.listen(3000);
