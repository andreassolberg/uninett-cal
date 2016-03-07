define(function(require, exports, module) {
	"use strict";

	var
		Model = require('./Model');


	var moment = require('moment');
	require('momentl');
	require('momenttz');



	var escapeHTML = (function() {
		var MAP = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&#34;',
			"'": '&#39;'
		};
		var repl = function(c) {
			return MAP[c];
		};
		return function(s) {
			return s.replace(/[&<>'"]/g, repl);
		};
	})();



	var Event = Model.extend({
		"init": function(data) {
			this.data = data;
			this.start = moment.tz(data.StartTime, moment.ISO_8601, "Europe/Amsterdam");
			this.end = moment.tz(data.EndTime, moment.ISO_8601, "Europe/Amsterdam");

			// console.log("Now ", Event.getNow().format());
			// console.log("Setting start time ", data.StartTime, this.start.format());

		},


		"getStrCurrent": function(type) {
			var now = Event.getNow();
			var str = '<div class="xevent" style="">';

			var timemrk = '';

			if (type === 'now') {

				// if (this.start.isBefore(now)) {
				// 	// str += '<i class="fa fa-step-forward"></i> ' + this.start.fromNow();
				// } else {
				// 	str += '<p class="timemrk" ><i class="fa fa-step-forward"></i> ' + this.start.fromNow(true) + '</p>';
				// }


				if (!this.end.isBefore(now)) {
					timemrk += '<span style="white-space: nowrap;"  class="timemrk" ><i class="fa fa-hourglass-end"></i> ' + this.end.fromNow(true) + '</span>';
				}
			}

			if (type === 'near') {

				if (!this.start.isBefore(now)) {

					timemrk += '<span style="white-space: nowrap;" class="timemrk" ><i class="fa fa-step-forward"></i> ' + this.end.fromNow(true) + '</span>';
				}

			}


			if (this.data.CalendarEventDetails && this.data.CalendarEventDetails.Subject) {
				str += '<p class="eventTitle">' + escapeHTML(this.data.CalendarEventDetails.Subject) + timemrk + '</p>';
			}

			str += '<p>';
			if (this.data.CalendarEventDetails && this.data.CalendarEventDetails.Location) {
				str += '<span><i class="fa fa-map-marker"></i> ' + escapeHTML(this.data.CalendarEventDetails.Location) + '</span>';
			}



			// str += (this.start.isBefore(now) ? 'startet' : 'starter') + ' ' + this.start.fromNow();
			// str += ' og ';
			// str += (this.end.isBefore(now) ? 'var ferdig' : 'er ferdig') + ' ' + this.end.fromNow();



			// if (type === 'now') {

			// 	str += '<p>startet ' + this.start.fromNow() + ' og er ferdig ' + this.end.fromNow() + '</p>';
			// } else  {
			// 	str += '<p>startet ' + this.start.fromNow() + ' og er ferdig ' + this.end.fromNow() + '</p>';
			// }
			// str += '</p>';

			// str += '<p>' + Math.abs(this.start.diff(now, "hours")) + '</p>';

			if (Math.abs(this.start.diff(now, "hours")) > 8 ||
				Math.abs(this.end.diff(now, "hours")) > 8) {

				str += '';
			} else {

				str += '<span style="margin-left: 1em"><i class="fa fa-clock-o"></i> ' + this.start.format('HH:mm') + '-' +
					this.end.format('HH:mm') + '</span>';


			}


			str += '</p>';

			str += '</div>';
			return str;
		},


		"getStr": function(type) {

			var str = '<p>';
			// console.log("get string of this event", this);

			if (type === 'season') {
				str += this.start.format('Do MMMM') + ' - ' +
					this.end.clone().subtract(5, 'minutes').format('Do MMMM') + ' ';

			} else {
				str += this.start.format('HH:mm') + '-' +
					this.end.format('HH:mm') + ' ';

			}


			if (this.data.CalendarEventDetails && this.data.CalendarEventDetails.Subject) {
				str += escapeHTML(this.data.CalendarEventDetails.Subject);
			}
			if (this.data.CalendarEventDetails && this.data.CalendarEventDetails.Location) {
				str += '<br/>(<span style="font-size: 90%">' + escapeHTML(this.data.CalendarEventDetails.Location) + '</span>)';
			}
			if (this.data.BusyType) {
				str += ' ' + escapeHTML(this.data.BusyType);
			}
			str += '</p>';
			return str;

		},

		"getBusyType": function() {
			if (this.data.CalendarEventDetails && this.data.CalendarEventDetails.Location &&
				this.data.CalendarEventDetails.Location === 'Norge') {
				return 'Red';

			}
			if (this.data.BusyType) {
				return this.data.BusyType;
			}
			return 'Error';
		},

		"overlapTimeslot": function(period, resolution) {
			if (this.start.isAfter(period, resolution)) {
				return false;
			} // Event is starting after the period end
			if (this.end.isBefore(period, resolution)) {
				return false;
			} // Event is ending before period start
			return true;

		},

		"overlap": function(periodstart, periodend) {
			// var periodend = periodstart.clone().add(30, 'minutes');
			if (this.start.isAfter(periodend, 'minute') ||
				this.start.isSame(periodend, 'minute')
			) {
				return false;
			} // Event is starting after the period end
			if (this.end.isBefore(periodstart, 'minute') ||
				this.end.isSame(periodstart, 'minute')
			) {
				return false;
			} // Event is ending before period start
			return true;
		}



	});

	Event.getNow = function(update) {

		// var x = moment('2016-03-03 12:20');
		// return x;


		if (update) {
			Event._now = moment().tz("Europe/Amsterdam");
		} else if (!Event.hasOwnProperty("_now")) {
			Event._now = moment().tz("Europe/Amsterdam");
		}
		return Event._now;
	}


	Event.mergeEventClasses = function(events) {

		var levels = {
			'Free': 0,
			'OOF': 8,
			'Tentative': 10,
			'Red': 15,
			'Busy': 20
		};
		var max = 0;
		for (var i = 0; i < events.length; i++) {
			if (levels[events[i].getBusyType()] > max) {
				max = levels[events[i].getBusyType()];
			}
		}
		for (var key in levels) {
			if (levels[key] === max) {
				return key;
			}
		}
		return 'Error';
	}



	return Event;

});