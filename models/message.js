'use strict'

var mongoose = require('bluebird').promisifyAll(require('mongoose'));
var Schema = mongoose.Schema;

var messageSchema = new Schema({
	channel_id: { type: String, required: true },
	timestamp: { type: String, required: true },
	user: { type: String, required: true },
	interval: { type: Number, required: true },
	interval_type: { type: String, required: true },
	created_at: Date,
  	updated_at: Date,
  	delete_at: Date
});

messageSchema.pre('save', function(next) {
  	var currentDate = new Date();
  
  	this.updated_at = currentDate;


  	if (!this.created_at) {
		this.created_at = currentDate;

		this.delete_at = new Date(this.created_at);
  		switch(this.interval_type.toLowerCase()) {
		    case 'year'   :  this.delete_at.setFullYear(this.delete_at.getFullYear() + this.interval);  break;
		    case 'quarter':  this.delete_at.setMonth(this.delete_at.getMonth() + 3*this.interval);  break;
		    case 'month'  :  this.delete_at.setMonth(this.delete_at.getMonth() + this.interval);  break;
		    case 'week'   :  this.delete_at.setDate(this.delete_at.getDate() + 7*this.interval);  break;
		    case 'day'    :  this.delete_at.setDate(this.delete_at.getDate() + this.interval);  break;
		    case 'hour'   :  this.delete_at.setTime(this.delete_at.getTime() + this.interval*3600000);  break;
		    case 'minute' :  this.delete_at.setTime(this.delete_at.getTime() + this.interval*60000);  break;
		    case 'second' :  this.delete_at.setTime(this.delete_at.getTime() + this.interval*1000);  break;
		    default       :  this.delete_at = undefined;  break;
  		}
	}

  	next();
});

var Message = mongoose.model('Message', messageSchema);

// make this available to our users in our Node applications
module.exports = Message;