'use strict';

const RtmClient = require('@slack/client').RtmClient;
const config = require('./config');
const slack = new RtmClient(config.slack.botToken);
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const message = require('./models/message');

var AsyncPolling = require('async-polling');

var polling = AsyncPolling(function (end) {
    // Every 5 seconds check database for messages that need purged via message.model
  	// This will send the message 'this is a test message' to the channel identified by id 'C0CHZA86Q'
  	slack.sendMessage('this is a test message', 'C0CHZA86Q', function messageSent() {
    	// optionally, you can supply a callback to execute once the message has been sent
  	});
  	// Here I want to stop the polling: 
    this.stop();
    end();
}, 3000);

slack.start();

slack.on(RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, function () {
  polling.run();
});

//listen
slack.on(RTM_EVENTS.MESSAGE, function (message) {
  // Listens to all `message` events from the team
});

polling.on('error', function (error) {
    // The polling encountered an error, handle it here. 
});
polling.on('result', function (result) {
    // The polling yielded some result, process it here. 
});