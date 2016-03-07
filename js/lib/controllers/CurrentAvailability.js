define(function(require, exports, module) {
	"use strict";

	var
		dust = require('dust'),
		Pane = require('./Pane'),
		EventEmitter = require('../EventEmitter'),
		utils = require('../utils'),
		$ = require('jquery'),
		moment = require('moment'),

		Event = require('../models/Event'),

		UserCalendar = require('../models/UserCalendar'),
		UserCalendarCurrent = require('../models/UserCalendarCurrent'),

		template = require('text!templates/currentavailability.html');


	/*
	 * This controller controls 
	 */
	var CurrentAvailability = Pane.extend({
		"init": function(app, feideconnect, freebusystore) {

			var that = this;
			this.app = app;
			this.feideconnect = feideconnect;
			this.freebusystore = freebusystore;

			this.fullscreen = false;

			this._super();
			dust.loadSource(dust.compile(template, "currentavailability"));


			that.now = Event.getNow();
			setInterval(function() {
				that.now = Event.getNow(true);
				// that.updateTimer();
			}, 1000);



			// this.el.on("click", ".currentBox", function(e) {
			// 	e.preventDefault();
			// 	$(e.currentTarget).toggleClass("currentBoxFocus");
			// });

			this.freebusystore.on("updated", this.proxy("updateData"));

			this.initLoad();
		},


		"setFullscreen": function(v) {
			this.fullscreen = v;
			var group = this.app.getGroup();
			$("body").addClass("fullscreen");
			this.app.setHash('/current/group/' + group + (this.fullscreen ? '/fullscreen' : ''));
		},

		"initLoad": function() {
			var that = this;
			this.draw()
				.then(function() {
					// console.error(" ››› Drawing completed");
					return that.freebusystore.onLoaded();
				})
				// .then(this.freebusystore.proxy("onLoaded"))
				.then(function() {
					// console.error(" ›› freebusystore");
				})
				.then(this.proxy("updateData"))
				.then(this.proxy("_initLoaded"));

		},

		"reload": function() {
			// console.error("Reloading...");
			this.postLoad();
			// this.load();
		},

		"load": function(selectedGroup) {

			var group = this.app.getGroup();
			this.app.setHash('/current/group/' + group + (this.fullscreen ? '/fullscreen' : ''));
			this.activate();

		},



		"draw": function(act) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var view = {
					"week": true
				};
				dust.render("currentavailability", view, function(err, out) {
					// console.error("Render freebusy", out);
					// console.log("that.el", that.el);
					that.el.empty().append(out);

					if (!err) {
						resolve()
					} else {
						reject(err);
					}
				});
				if (act) {
					that.activate();
				}
			});
		},

		"getUserFilter": function() {

			var filter = {};

			var currentUser = this.freebusystore.getCurrentUser();
			var groups = this.freebusystore.getGroups();
			var group = this.app.getGroup();

			if (group === null) {
				return null;
			}
			if (group === '_all') {
				return null;
			}
			if (group === '_me' && currentUser) {
				filter[currentUser] = true;
			}
			if (groups.hasOwnProperty(group)) {
				for (var i = 0; i < groups[group].users.length; i++) {
					filter[groups[group].users[i]] = true;
				}
			}
			return filter;
		},

		"getUserCell": function(cal, day, i) {
			var str = '';

			var period = this.weekselector.getPeriod(day, i);
			var periodend = this.weekselector.getPeriod(day, i + 1);
			var check = cal.checkPeriod(period, periodend);

			var even = (i % 2 === 0) ? 'even' : 'odd';
			var classes = ['a', even];

			if (period.isBefore(this.now, 'minute')) {
				classes.push('Past');
			}

			if (check === null) {

				classes.push('Avail');
				if (i === 7 || i === 8) {
					classes.push('Lunch');
				} else if (i <= 1 || i >= 14) {
					classes.push('Lunch');
				}

			} else {
				classes.push('c');
				classes.push(UserCalendar.mergeEventClasses(check));
				// str += '<td data-day="' + day + '" data-cell="' + i + '" class="a c ' + even + ' ' + classes + '"></td>';
			}

			str += '<td data-day="' + day + '" data-cell="' + i + '" class="' + classes.join(' ') + '"></td>';

			return str;
		},

		"getUserDay": function(cal, day) {
			var str = '<td class="sep"></td>';
			for (var i = 0; i < 16; i++) {
				str += this.getUserCell(cal, day, i);
			}
			return str;
		},

		"getBigName": function(name) {

			var s = name.split(" ");
			// console.error("s", s);
			// s[0] = '<span style="font-size: 200%">' + s[0] + '</span>';
			// return s.join(" ");
			return s[0];

		},



		"getCurrentEvents": function(matches, type) {

			var cmix = {
				"now": "card-danger",
				"near": "card-warning",
				"next": "card-info"
			};
			var str = '';

			console.log("Looking up ", type);
			// 
			for (var i = 0; i < matches[type].length; i++) {
				str += '<div class="card-block ' + cmix[type] + '" style="padding: 3px">';
				str += matches[type][i].getStrCurrent(type);
				str += '</div>';
			}

			return str;


		},


		"getUserRow": function(currentStatus, wide) {



			// var userCalendar = this.freebusystore.getUserCalendarByMail(user.mail);

			// if (userCalendar === null) return "";

			// console.log("User calendar for ", user.mail, " is ", userCalendar);
			// var currentStatus = userCalendar.checkCurrent();

			var user = currentStatus.user;

			var str = '';

			// if (wide) {
			// 	str += '<div class="col-xs-4 col-sm-3 col-md-2 col-lg-1">';
			// } else {
			// 	str += '<div class="col-xs-6 col-sm-4 col-md-3 col-lg-2">';
			// }

			// str += '<div class="card-deck-wrapper">';
			// str += '<div class="card-columns">'

			var cmix = {
				"free": "card-success",
				"busy": "card-danger",
				"near": "card-warning",
				"next": "card-success"
			};



			// var str = '<div class="col-xs-3 col-sm-2 col-md-1 col-lg-1">';
			str += '<div class="card ' + cmix[currentStatus.status] + '">';
			str += '<div class="card-block" style="padding-top: 3px; padding-bottom: 3px">' + this.getBigName(user.name) + '</div>';
			str += '<img class="card-img img-fluid" src="https://cal.uninett.no/media/?mail=' + user.mail + '" />';


			str += this.getCurrentEvents(currentStatus, "now");
			str += this.getCurrentEvents(currentStatus, "near");
			str += this.getCurrentEvents(currentStatus, "next");



			// str += '<div class="card-block">' +

			// 	// '<p style="font-size: 40%">' + user.mail + '</p>' +
			// 	// '<pre>' + JSON.stringify(currentStatus, undefined, 1) + '</pre>'
			// 	// '<h3 class="caname" style="font-size: 80%"><span>' + this.getBigName(user.name) + '</span></h3>' +
			// 	'<div class="cae now">' + this.getCurrentEvents(currentStatus, "now") + '</div>' +
			// 	'<div class="cae near">' + this.getCurrentEvents(currentStatus, "near") + '</div>' +
			// 	'<div class="cae next">' + this.getCurrentEvents(currentStatus, "next") + '</div>' +
			// 	'</div>';

			str += '</div>';


			return str;
		},

		"setGroup": function(setGroup) {
			// if (typeof setGroup !== 'undefined') {
			// 	// console.error("Set group", setGroup);
			// 	this.groupselector.set(setGroup);
			// }

			// this.app.setHash('/current/group/' + setGroup);

			this.app.setHash('/current/group/' + setGroup + (this.fullscreen ? '/fullscreen' : ''));
			// this.onLoaded().
			// 	then(this.proxy("updateData"));

		},

		"updateData": function() {
			// console.error(" --- updateData()");

			var i;
			var mv = this.el.find('.mainview').empty();

			var group = this.app.getGroup();
			var filter = this.getUserFilter();
			var targetlist = this.freebusystore.getUsers();
			var that = this;

			var key, item;
			var targetarray = [];

			var wide = (filter === null);


			// console.error("Filter", filter);

			for (key in targetlist) {

				var userCalendar = this.freebusystore.getUserCalendarByMail(targetlist[key].mail);
				if (userCalendar === null) {
					continue;
				}
				// console.log("User calendar for ", targetlist[key].mail, " is ", userCalendar);
				var currentStatus = userCalendar.checkCurrent();
				targetarray.push(currentStatus);
			}

			UserCalendarCurrent.sort(targetarray);

			for (i = 0; i < targetarray.length; i++) {
				if (filter !== null && !filter.hasOwnProperty(targetarray[i].user.mail)) {
					continue;
				}
				item = targetarray[i];
				// console.error("About to process", item);
				// console.log("row", this.getUserRow(item));
				var ur = this.getUserRow(item, wide);
				mv.append(ur);
			}

			// setTimeout(function() {
			// that.el.find(".currentBox").matchHeight({
			//     byRow: true,
			//     property: 'height',
			//     target: null,
			//     remove: false
			// });
			// console.error("Set same height");
			// }, 200);


		}



	}).extend(EventEmitter);

	return CurrentAvailability;

});