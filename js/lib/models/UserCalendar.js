define(function(require, exports, module) {
	"use strict";	

	var 
		Model = require('./Model'),
		Event = require('./Event'),
		moment = require('moment'),
		UserCalendarCurrent = require('./UserCalendarCurrent')
		;


	var debug = 2;

	var UserCalendar = Model.extend({
		"init": function(user, cal) {
			this.user = user;
			this.cal = cal;
			this.events = [];
			this.eventDayCache = {};

			// if (this.cal.FreeBusyViewType) {
			// 	console.log("Calendar data ", this.user.name, this.cal.FreeBusyViewType, this.cal);
			// } else {
			// 	console.log("Calendar data type not reckognized", this.user.name);
			// }

			if (this.cal) {
				for(var i = 0; i < this.cal.length; i++) {
					this.events.push(new Event(this.cal[i]));
				}
			} else {
				console.log("Could not find calendar event array for " + this.user.name);
			}
		},


		"getPopover": function(period, periodend, type) {

			var str = '';
			// console.log("Get popover for period ", period.format('lll'), periodend.format('lll'));
			var res = this.checkPeriod(period, periodend);
			if (res === null) {return 'Ingen hendelser';}

			for(var i = 0; i < res.length; i++) {
				str += '<p>' + res[i].getStr(type) + '</p>';
			}
			return str;

		},

		"getDayEvents": function(period) {
			var daystr = period.format('L');
			if(this.eventDayCache.hasOwnProperty(daystr)) {
				return this.eventDayCache[daystr];
			}
			var matches = [];

			for(var i = 0; i < this.events.length; i++) {
				if (this.events[i].overlapTimeslot(period, 'day')) {
					matches.push(this.events[i]);
				} 
			}

			this.eventDayCache[daystr] = matches;
			return matches;
		},


		"checkCurrent": function() {


			// var now = moment("2015-06-08 14:10");
			var now = Event.getNow().clone();
			var nowF = now.clone().add(-1, "minutes");
			var nowT = now.clone().add(1, "minutes");
			var nearF = now.clone().add(-15, "minutes");
			var nearT = now.clone().add(30, "minutes");
			var nextF = now.clone().add(30, "minutes");
			var nextT = now.clone().add(60*3, "minutes");

			var matches = {
				"now": [],
				"near": [],
				"next": [],
				"status": "free"
			};


			var dayevents = this.getDayEvents(now);

			for(var i = 0; i < dayevents.length; i++ ) {
				if (dayevents[i].overlap(nearF, nextT)) {

					if (dayevents[i].overlap(nowF, nowT)) {
						matches.now.push(dayevents[i]);	

					} else if (dayevents[i].overlap(nearF, nearT)) {
						matches.near.push(dayevents[i]);

					} else if (dayevents[i].overlap(nextF, nextT)) {
						matches.next.push(dayevents[i]);	
					}
					
				}
			}


			var obj = new UserCalendarCurrent(this.user, this.cal, matches.now, matches.near, matches.next);

			return obj;

		},

		"checkPeriod": function(period, periodend) {

			var matches = [];
			var dayevents = this.getDayEvents(period);
			for(var i = 0; i < dayevents.length; i++ ) {
				if (dayevents[i].overlap(period, periodend)) {
					matches.push(dayevents[i]);
				}
			}

			if (matches.length > 0) {
				return matches;	
			}
			

			if (--debug > 0) {
				console.log("Check period ", period.format('lll') );
				console.log("For this user ", this.user);
				console.log("With this calendar ", this.cal);
				console.log("MAtches ", matches);
			}
			return null;

		}

	});

	return UserCalendar;






});

