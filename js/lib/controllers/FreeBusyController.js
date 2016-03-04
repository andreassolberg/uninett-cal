define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('./Pane'),
		EventEmitter = require('../EventEmitter'),
		utils = require('../utils'),
		$ = require('jquery'),

		WeekSelector = require('../WeekSelector'),

		
		Event = require('../models/Event'),

		moment = require('moment'),

		template = require('text!templates/freebusy.html')
		;

	/*
	 * This controller controls 
	 */
	var FreeBusyController = Pane.extend({
		"init": function(app, feideconnect, freebusystore) {

			var that = this;
			this.app = app;
			this.feideconnect = feideconnect;
			this.freebusystore = freebusystore;

			this._super();

			dust.loadSource(dust.compile(template, "freebusy"));

			that.now = Event.getNow();
			setInterval(function() {
				that.now = Event.getNow(true);
				that.updateTimer();
			}, 5000);

			this.setupPopover();



			this.el.on('click', '#showmeetingroom', function(e) {
				// e.preventDefault();
				that.updateData();
			});
			


			this.weekselector = new WeekSelector(this.el);
			this.weekselector.on(function() {
				that.updateData();
			});

			this.freebusystore.on("updated", this.proxy("updateData"));

			this.initLoad();
		},

		"initLoad": function() {
			var that = this;
			this.draw()
				.then(function() {
					that.weekselector.display();
				})
				.then(this.freebusystore.proxy("onLoaded"))
				.then(this.proxy("updateData"))
				.then(this.proxy("updateTimer"))
				.then(this.proxy("_initLoaded"));

		},

		"showMeetingRoom": function () {

			return this.el.find("#showmeetingroom").is(":checked");

		},

		"setupPopover": function() {
			var that = this;
			this.popovercache = {};

			var popOverSettings = {
				animation: true,
				placement: 'bottom',
				container: 'body',
				html: true,
				trigger: "hover",
				selector: 'td.a.c',
				content: function () {
					var cell = $(this).data('cell');
					var day = $(this).data('day');
					var user = $(this).closest('tr').data('user');
					var index = that.weekselector.getIndex();
					var cachestr = index + ':' + user + ':' + day + ':' + cell;

					var userCalendar = that.freebusystore.getUserCalendarByMail(user);

					if (userCalendar === null) {
						return 'No data';
					}

					// console.log("popover cache string", cachestr);
					if (that.popovercache.hasOwnProperty(cachestr)) {
						return that.popovercache[cachestr];
					}
					// console.log("popover with user [" + user+ "]", user, day, cell);
					var period = that.weekselector.getPeriod(day, cell);
					var periodend = that.weekselector.getPeriod(day, cell+1);
					var content = userCalendar.getPopover(period, periodend);
					// console.log("Getpopover for period", period.format('lll'));
					// that.popovercache[cachestr] = content;
					
					return content;
			    }
			};

			// this.el.popover(popOverSettings);
		},

		"updateTimer": function() {
			var ut = this.freebusystore.getUpdateTime().fromNow();
			$("#updateTimer").empty().append("Oppdateres " + ut);
		},

		"updateNow": function() {
			$("#updateTimer").empty().append('Oppdaterer nå <i class="fa fa-spinner fa-spin"></i>');
		},


		"draw": function(act) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var view = {"week": true};
				dust.render("freebusy", view, function(err, out) {
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
					// console.error("ACTIVATE");
					that.activate();
				}
			});
		},

		"getUserFilter": function() {

			var filter = {};

			var currentUser = this.freebusystore.getCurrentUser();
			var groups = this.freebusystore.getGroups();
			var group = this.app.getGroup();

			if (group === null) {return null;}
			if (group === '_all') {return null;}
			if (group === '_me' && currentUser) {
				filter[currentUser] = true;
	 		}
	 		if (groups.hasOwnProperty(group)) {
	 			for(var i = 0; i < groups[group].users.length; i++) {
	 				filter[groups[group].users[i]] = true;
	 			}
	 		}
	 		return filter;
	 	},

		"getUserCell": function(cal, day, i) {
			var str = '';

			var period = this.weekselector.getPeriod(day, i);
			var periodend = this.weekselector.getPeriod(day, i+1);
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
				classes.push(Event.mergeEventClasses(check));
				// str += '<td data-day="' + day + '" data-cell="' + i + '" class="a c ' + even + ' ' + classes + '"></td>';
			}

			str += '<td data-day="' + day + '" data-cell="' + i + '" class="' + classes.join(' ') + '"></td>';

			return str;
		},

		"getUserDay": function(cal, day) {
			var str = '<td class="sep"></td>';
			for(var i = 0; i < 16; i++) {
				str += this.getUserCell(cal, day, i);
			}
			return str;
		},

		"getUserRow": function(user) {
			var str = '<tr data-user="' + user.mail + '">' + 
				'<td class="user">' + user.name + '</td>';
			var day;

			var userCalendar = this.freebusystore.getUserCalendarByMail(user.mail);

			if (userCalendar !== null) {
				for(day = 0; day < 5; day++ ) {
					str += this.getUserDay(userCalendar, day);
				}
			} else {
				str += '<td class="nodata" colspan="' + (5*17) + '">No data</td>';
				return '';
			}

			str += '</tr>';
			return str;
		},

		"setGroup": function(setGroup) {
			// if (typeof setGroup !== 'undefined') {
			// 	// console.error("Set group", setGroup);
			// 	this.groupselector.set(setGroup);
			// }

			// if (typeof setGroup === "undefined") {return;}

			this.app.setHash('/freebusy/group/' + setGroup);
			// this.onLoaded().
			// 	then(this.proxy("updateData"));

		},

		"load": function() {
			var group = this.app.getGroup();
			this.app.setHash('/freebusy/group/' + group);
			this.activate();
			this.app.setTopLevelPane("freebusy");
			this.updateData();
		},

		"updateData": function() {

			// if (typeof setGroup !== 'undefined') {
			// 	// console.error("Set group", setGroup);
			// 	// this.groupselector.set(setGroup);
			// }

			// this.updateNow();
			// console.error("FreeBusyController – updateData");

			var i;
			var mh = this.el.find('.mainheader').eq(0).empty();

			var str = '<tr><td>&nbsp;</td>';
			for(i = 0; i < 5; i++) {
				str += '<td class="daytitle" colspan="17">' + this.weekselector.getDayTitle(i) + '</td>';
			}
			str += '</tr>';
			mh.append(str);

			var group = this.app.getGroup();
			var filter = this.getUserFilter();


			
			var targetlist = this.freebusystore.getUsers();


			var mv = this.el.find(".mainview").eq(0).empty();
			var key, item;
			var targetarray = [];

			for(key in targetlist) {
				targetarray.push(targetlist[key]);
			}
			targetarray.sort(function(a,b) {
				if (a.name > b.name) {return 1;}
				if (a.name < b.name) {return -1;}
				return 0;
			});





			// console.error("Filter is", filter);
			// console.error("group is", group);
			// console.error("Target array", targetarray);


			for(i = 0; i < targetarray.length; i++) {
				if (filter !== null && !filter.hasOwnProperty(targetarray[i].mail)) {continue;}
				item = targetarray[i];
				// console.error("About to process", item);
				// console.log("row", this.getUserRow(item));
				mv.append(this.getUserRow(item));
			}



			
			if (this.showMeetingRoom()) {
				var moreResources = [];
				var r = this.freebusystore.getResources();
				for(var j in r) {
					moreResources.push(r[j]);
				}

				mv.append('<tr><td colspan="30" style="text-align: center">Møterom</td></tr>');

				for(i = 0; i < moreResources.length; i++) {
					item = moreResources[i];
					mv.append(this.getUserRow(item));
				}

			}
			

		}


	}).extend(EventEmitter);

	return FreeBusyController;

});
