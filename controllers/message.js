'use strict';
const config = require('../config');
const Slack = require('../utils/slack');

const slack = new Slack({
  token: config.slack.token
});

function slackTokenMatch(token) {
  const tokens = config.slack.webhooks.requestTokens;
  const match = tokens.filter((t) => t === token);

  return match.length > 0;
}

module.exports.slackHook = function(request, reply) {
  
};