'use strict';

const RtmClient = require('@slack/client').RtmClient,
  WebClient = require('@slack/client').WebClient,
  config = require('./config'),
  MemoryDataStore = require('@slack/client').MemoryDataStore,
  messageClient = new RtmClient(config.slack.botToken, {
    logLevel: 'error', 
    dataStore: new MemoryDataStore(),
    autoReconnect: true,
    autoMark: true
  }),
  botCommunicator = new WebClient(config.slack.botToken),
  chatForeman = new WebClient(config.slack.token),
  RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS,
  RTM_EVENTS = require('@slack/client').RTM_EVENTS,
  Message = require('./models/message'),
  AsyncPolling = require('async-polling'),
  mongoose = require('mongoose'),
  mongoOpts = {
    db: { native_parser: true },
    user: config.mongo.username,
    pass: config.mongo.password
  },
  chatOptions = {
    as_user:true
  },
  messageReceivedRes = [
    'Target acquired.',
    'Affirmative.',
    'Message scheduled for termination. Now, come with me if you want to live.',
    'Message shall be terminated. No problemo.',
    'It\'s in your nature to destroy your messages.',
    'I need your clothes, your boots and your messages that need terminated.'
  ],
  messageDeletedRes = [
    'Hasta la vista, message.',
    'Message terminated.',
    'Terminated.',
    'I\'ll be back back. That message, won\'t.',
    'Target destroyed.',
  ];

const polling = AsyncPolling((end) => { 
  // Every 1 second check database for messages that need purged via message.model
  Message.find().and([
      {'delete_at': {'$lt': new Date()}},
      {'deleted': false}])
    .exec((err, messages) => {

      if (err) throw err;
      
      messages.map((message) => {
        chatForeman.chat.delete(message.timestamp, message.channel_id)
          .then((result) => {
            message.deleted = true;
            message.save((err) => {
              if (err) { 
                console.log ('Error on save!')
              } else {
                let index = Math.floor((Math.random() * messageDeletedRes.length) + 0);
              
                botCommunicator.chat.postMessage(message.user, messageDeletedRes[index], chatOptions)
                  .then((result) => {
                    console.log('Successfully sent confirmation message');
                  })
                  .catch((error) => {
                    console.log('Error sending confirmation message');
                  });
              }
            });
          })
          .catch((error) => {
            console.log(error);
          });
      }); 
    });

  end();
}, 1000);

// Connect to MongoDB
mongoose.connect('mongodb://'+config.mongo.username+':'+config.mongo.password+'@'+config.mongo.host+':'+config.mongo.port+'/'+config.mongo.dbName, function (err, res) {
  if (err) { 
    console.log ('ERROR connecting to: ' + config.mongo.dbName + '. ' + err);
  } else {
    console.log ('Succeeded connected to: ' + config.mongo.dbName);
  }
});

messageClient.start();

messageClient.on(RTM_CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
  polling.run();
});

// Listen for message events from our connected channels
messageClient.on(RTM_EVENTS.MESSAGE, (message) => {

  if(typeof message.text !== 'undefined') {
    if (message.text.startsWith('!kill' + ' ')) {
      let parts = message.text.split(' ', 3),
          intervalParts,
          intervalType = 's',
          interval = 10,
          index;

      if(parts.length > 1) {
        intervalParts = parts[1].split(/(\d+)/).filter(Boolean);

        if(typeof intervalParts[0] !== 'undefined' && !isNaN(intervalParts[0])) {
          interval = intervalParts[0];    
        } 

        if(typeof intervalParts[1] !== 'undefined') {
          intervalType = intervalParts[1];  
        }  
      }

      chatForeman.users.info(message.user)
        .then((result) => {
          
          let newMessage = new Message({
            channel_id: message.channel,
            channel_name: messageClient.dataStore.getChannelGroupOrDMById(message.channel).name,
            timestamp: message.ts,
            team: message.team,
            user: message.user,
            user_name: result.user.name,
            interval: interval,
            interval_type: intervalType
          });

          newMessage.save((error) => {
            if (error) { 
              console.log('Error on message save!');
            } else {
              index = Math.floor((Math.random() * messageReceivedRes.length) + 0);
              
              botCommunicator.chat.postMessage(result.user.id, messageReceivedRes[index], chatOptions)
                .then((result) => {
                  console.log('Successfully sent confirmation message');
                })
                .catch((error) => {
                  console.log('Error sending confirmation message');
                });
              }
          });

        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
});

polling.on('error', (error) => {
  console.log('Polling error');
});

polling.on('result', (result) => {
  console.log('Polling result');
});