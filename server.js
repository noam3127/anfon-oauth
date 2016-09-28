'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const handler = require('./index').handler;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const context = {
  done() {},
  succeed() {},
  fail() {}
}
app.post('/slack-oauth', function(req, res) {
  handler(req.query, context);
});
