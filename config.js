'use strict';
var getEnv = require('getenv');

module.exports = {
  port: getEnv.int('PORT', 3001),
  mongo:{
    username: getEnv('DISINT_MONGO_USERNAME', ''),
    password: getEnv('DISINT_MONGO_PASSWORD', ''),
    host: getEnv('MONGO_HOST', 'localhost'),
    port: getEnv.int('MONGO_PORT', 5984),
    dbName: getEnv('DISINT_MONGO_NAME', '')
  },
  slack:{
    token: getEnv('SLACK_TOKEN', ''),
    botToken: getEnv('DISINT_BOT_SLACK_TOKEN', '')
  }
};