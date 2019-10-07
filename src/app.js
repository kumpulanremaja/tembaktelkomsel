const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

const tselRoute = require('./api/tsel.route');

app.use(cors());

process.env.NODE_ENV !== 'prod' && app.use(morgan('dev'));

app.use(cookieParser());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Register api routes
app.use('/', tselRoute);

app.use('*', (req, res) => res.status(404).json({ error: 'not found' }));

module.exports = app;
