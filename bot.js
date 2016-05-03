'use strict';

const RtmClient = require('@slack/client').RtmClient;
const WebClient = require('@slack/client').WebClient;
const config = require('./config');
const MemoryDataStore = require('@slack/client').MemoryDataStore;
const slack = new RtmClient(config.slack.botToken, {
  logLevel: 'error', 
  dataStore: new MemoryDataStore(),
  autoReconnect: true,
  autoMark: true
});
const slackWeb = new WebClient(config.slack.botToken);
const RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var Message = require('./models/message');
var AsyncPolling = require('async-polling');
var mongoose = require('mongoose');
var mongoOpts = {
  db: { native_parser: true },
  user: config.mongo.username,
  pass: config.mongo.password
}

// Connect to MongoDB
mongoose.connect('mongodb://'+config.mongo.username+':'+config.mongo.password+'@'+config.mongo.host+':'+config.mongo.port+'/'+config.mongo.dbName, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + config.mongo.dbName + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + config.mongo.dbName);
  }
});

var polling = AsyncPolling(function (end) { 
  console.log(new Date());
  // Every 1 second check database for messages that need purged via message.model
  Message.find().and([{'delete_at': {'$lt': new Date()}},{'deleted': false}]).exec(function(err, messages) {
    if (err) throw err;
    
    messages.map(function(message) {
      slackWeb.ChatFacet.delete(message.timestamp, message.channel_id);  
    });
    
    console.log('some');
    console.log(messages);
  });
	// This will send the message 'this is a test message' to the channel identified by id 'C0CHZA86Q'
	//slack.sendMessage('this is a test message', 'C0CHZA86Q', function messageSent() {
  	// optionally, you can supply a callback to execute once the message has been sent
	//});
  end();
}, 1000);

slack.start();

slack.on(RTM_CLIENT_EVENTS.RTM.AUTHENTICATED, function () {
  console.log('opened');  
  polling.run();
});

//listen
slack.on(RTM_EVENTS.MESSAGE, function (message) {
  console.log(message);
  if(typeof message.text !== 'undefined') {
    if (message.text.startsWith('!kill' + ' ')) {
      let parts = message.text.split(' ', 3),
          intervalParts = parts[1].split(/(\d+)/).filter(Boolean),
          intervalType;

      if(typeof intervalParts[1] === 'undefined') {
        intervalType = 's';
      } else {
        intervalType = intervalParts[1];  
      }

      var newMessage = new Message({
        channel_id: message.channel,
        channel_name: slack.dataStore.getChannelGroupOrDMById(message.channel).name,
        timestamp: message.ts,
        team: message.team,
        user: message.user,
        interval: intervalParts[0],
        interval_type: intervalType
      });

      newMessage.save(function (err) {if (err){ console.log ('Error on save!')}else{console.log('success');}} );
    }
  // Listens to all `message` events from the team
  }
});

polling.on('error', function (error) {
  console.log('error');
  console.log(error);
});

polling.on('result', function (result) {
  console.log('result');
  console.log(result);
});