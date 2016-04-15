'use strict';
const message = require('./controllers/message');


module.exports = [
  {
    path:'/webhooks/slack',
    method:'POST',
    handler: message.slackHook,
  }
];