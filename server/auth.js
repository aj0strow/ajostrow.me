var express = require('express');

function auth (user, pass) {
  var username = process.env.USERNAME || 'aj';
  var password = process.env.PASSWORD || 'ostrow';
  return user == username && pass == password;
}

module.exports = express.basicAuth(auth);