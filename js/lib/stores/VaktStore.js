define(function(require, exports, module) {

	"use strict";	

	var 

		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),
		Event = require('../models/Event'),
	
		UserCalendar = require('../models/UserCalendar'),

		Class = require('../class'),
		moment = require('moment')
		// Client = require('./Client'),
		// APIGK = require('./APIGK')
		;


	var now = moment();

	var UDSEntry = Class.extend({
		"init": function(props, userid) {
			this.userid = userid;
			for(var key in props) {
				this[key] = props[key];
			}
			this.start = moment(props.StartTime);
			this.end = moment(props.EndTime);
		},
		"inPast": function() {
			return this.end.isBefore(now);
		},
		"getDateStr": function() {
			return this.start.format("dddd, MMMM Do YYYY, H:mm") + ' - ' + this.end.format("H:mm");
		},
		"getView": function() {
			var txt = '<div class="media"><div class="media-left media-middle" style="padding-top: -4px">' +
				'<img style="margin: 0px; max-width: 48px; max-height: 48px" class="media-object img-circle center-block" src="https://calendar-api.uninett.no/media/?mail=' + this.userid +'" alt="..."></div>' +
				'<div class="media-body media-middle"><h4 style="margin: 0px">' + this.getDateStr() + '</h4><p>' + this.userid + '</p>' + 
				'</div></div>';
			return txt;

		}
	});


	var csorter = function(a, b) {
		// console.log("Comparing ", a, b);
		if (a.start.isBefore(b.start)) {
			return -1;
		}
		if (b.start.isBefore(a.start)) {
			return 1;
		}
		return 0;
	}

	var VaktStore = Controller.extend({
		"init": function(feideconnect) {

			this.feideconnect = feideconnect;


			this.data = null;
			this.entries = [];


			this.intervalSeconds = 5*60;
			this.interval = (this.intervalSeconds * 1000);
			this.updateAt = null;
			this.waiter = null;

			this._super();
			this.initLoad();

		},

		"initLoad": function() {

			// console.error("Loading FreeBusyStore");

			return this.load(true)
				.then(this.proxy("_initLoaded"));
				
		},

		"setReloader": function() {

			if (this.waiter !== null) {
				clearTimeout(this.waiter);
				this.waiter = null;
			}

			if (this.interval !== null) {
				this.updateAt = Event.getNow().clone().add(this.intervalSeconds, "seconds");
				this.waiter = setTimeout(this.proxy("load"), this.interval);
			}

		},

		"getUpdateTime": function() {
			return this.updateAt;
		},


		"getUsers": function() {
			return this.users;
		},

		"getResources":function() {
			return this.resources;
		},

		"getUserCalendarByMail": function(mail) {
			if (this.uc.hasOwnProperty(mail)) {
				return this.uc[mail];
			}
			return null;
		},
		"getGroups": function() {
			return this.data.groups;	
		},
		"getCurrentUser": function() {
			return this.data.currentUser;
		},

		"getSorted": function() {
			this.entries.sort(csorter);
			return this.entries;
		},

		"load": function() {
			var that = this;

			this.setReloader();


			return this.feideconnect._customRequest("https://uninett-cal.dataporten-api.no/vakt")
				.then(function(data) {
					that.data = data;
					that.entries = [];

					for(var userid in data.data) {
						for(var i = 0; i < data.data[userid].length; i++) {
							that.entries.push(new UDSEntry(data.data[userid][i], userid))	
						}
						
					}

				})
				.then(function() {
					that.setReloader();
					if (that.isLoaded) {
						that.emit("updated");	
					}
				});
		}


	}).extend(EventEmitter);


	return VaktStore;

});

