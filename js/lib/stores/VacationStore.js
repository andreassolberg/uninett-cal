define(function(require, exports, module) {

	"use strict";	

	var 

		Controller = require('../controllers/Controller'),
		EventEmitter = require('../EventEmitter'),
		Event = require('../models/Event'),
	
		UserCalendar = require('../models/UserCalendar'),

		moment = require('moment')
		// Client = require('./Client'),
		// APIGK = require('./APIGK')
		;


	var VacationStore = Controller.extend({
		"init": function(feideconnect) {

			// var that = this;
			this.feideconnect = feideconnect;


			this.data = null;
			this.uc = {};
			this.users = {};
			this.resources = {};

			this.intervalSeconds = 5*60;
			// this.interval = (this.intervalSeconds * 1000);
			this.interval = null;
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
				var n = Event.getNow().clone();
				this.updateAt = n.add(this.intervalSeconds, "seconds");
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

		"load": function() {
			var that = this;

			this.setReloader();

			return this.feideconnect._customRequest("https://uninett-cal.dataporten-api.no/ferie")
				.then(function(data) {
					that.data = data;

					// console.error("Received data", data); 
					var uid, i;
					for(i = 0; i < data.users.length; i++) {
						that.users[data.users[i].mail] = data.users[i];
					}
					for(uid in data.data ) {
						that.uc[uid] = new UserCalendar(that.users[uid], data.data[uid]);
					}
					for(uid in data.resources) {
						if (!that.resources.hasOwnProperty(uid)) { continue; }
						that.uc[uid] = new UserCalendar(that.resources[uid], data.resources[uid]);
					}
					// that.groupselector.display(data.groups);
					// that.drawContent();

					// console.error("Data loaded complete.")
				})
				.then(function() {
					that.setReloader();
					if (that.isLoaded) {
						that.emit("updated");	
					}
				});
		}


	}).extend(EventEmitter);


	return VacationStore;

});

