'use strict'

const mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	messageSchema = new Schema({
		channel_id: { type: String, required: true },
		channel_name: { type: String, required: true },
		timestamp: { type: String, required: true },
		user: { type: String, required: true },
		interval: { type: Number, required: true },
		interval_type: { type: String, required: true },
		team: { type: String, required: true },
		deleted: {type: Boolean, default: false},
		created_at: Date,
	  	updated_at: Date,
	  	delete_at: Date
	});

messageSchema.pre('save', function(next) {
  	let currentDate = new Date(),
  		intvl = this.interval_type.toLowerCase();
  
  	this.updated_at = currentDate;

  	if (!this.created_at) {
		this.created_at = currentDate;
		this.delete_at = new Date(this.created_at);

		if(intvl === 'y' || intvl === 'year') {
			this.delete_at.setFullYear(this.delete_at.getFullYear() + this.interval);
		} else if(intvl === 'q' || intvl === 'quarter') {
			this.delete_at.setMonth(this.delete_at.getMonth() + 3 * this.interval);
		} else if(intvl === 'mo' || intvl === 'month') {
			this.delete_at.setMonth(this.delete_at.getMonth() + this.interval);	
		} else if(intvl === 'w' || intvl === 'week') {
			this.delete_at.setDate(this.delete_at.getDate() + 7*this.interval);	
		} else if(intvl === 'd' || intvl === 'day') {
			this.delete_at.setDate(this.delete_at.getDate() + this.interval);	
		} else if(intvl === 'h' || intvl === 'hour') {
			this.delete_at.setTime(this.delete_at.getTime() + this.interval*3600000);	
		} else if(intvl === 'm' || intvl === 'minute') {
			this.delete_at.setTime(this.delete_at.getTime() + this.interval*60000); 	
		} else if(intvl === 's' || intvl === 'second' || intvl === '') {
			this.delete_at.setTime(this.delete_at.getTime() + this.interval*1000);	
		} else {
			this.delete_at.setTime(this.delete_at.getTime() + 10*1000);
		}
	}

  	next();
});

const Message = mongoose.model('Messages', messageSchema);

module.exports = Message;