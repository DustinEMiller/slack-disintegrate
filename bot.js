'use strict';

const RtmClient = require('@slack/client').RtmClient;
const config = require('./config');
const MemoryDataStore = require('@slack/client').MemoryDataStore;
const slack = new RtmClient(config.slack.botToken, {
  logLevel: 'error', 
  dataStore: new MemoryDataStore(),
  autoReconnect: true,
  autoMark: true
});
const RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var message = require('./models/message');
var AsyncPolling = require('async-polling');

var polling = AsyncPolling(function (end) {
    // Every 1 second check database for messages that need purged via message.model
    message.find({ admin: true }).and([{'delete_at': {'$lt': Date.now()}},{'delete': false}]).exec(function(err, messages) {
      if (err) throw err;
      // show the admins in the past month
      console.log(messages);
    });
  	// This will send the message 'this is a test message' to the channel identified by id 'C0CHZA86Q'
  	slack.sendMessage('this is a test message', 'C0CHZA86Q', function messageSent() {
    	// optionally, you can supply a callback to execute once the message has been sent
  	});
  	// Here I want to stop the polling: 
    this.stop();
    end();
}, 1000);

slack.start();

slack.on(RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, function () {
  polling.run();
});

//listen
slack.on(RTM_EVENTS.MESSAGE, function (message) {
  console.log(message);
  if (message.text.startsWith('!kill' + ' ')) {
    let parts = message.text.split(' ', 4);

    var newMessage = new message({
      channel_id: message.channel,
      channel_name: slack.dataStore.getChannelGroupOrDMById(message.channel),
      timestamp: message.ts,
      user: message.user,
      interval: parts[1],
      interval_type: parts[2]
    });

    // save the message
    newMessage.save(function(err) {
      if (err) throw err;
      // TODO: Alert user that message has been scheduled for deletion
      console.log('message created!');
      });
  }
  // Listens to all `message` events from the team
});

polling.on('error', function (error) {
    console.log(error);
});

polling.on('result', function (result) {
    console.log(result);
});