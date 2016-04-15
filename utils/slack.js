'use strict';

var internals = {};

module.exports = internals.Slack = function(options) {
  this.token = options.token;
};