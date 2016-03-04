define(function(require, exports, module) {
	"use strict";	



	var 
		dust = require('dust'),
		Pane = require('./Pane'),
		EventEmitter = require('../EventEmitter'),
		utils = require('../utils'),
		$ = require('jquery'),

		Event = require('../models/Event'),

		moment = require('moment'),

		template = require('text!templates/uds.html')
		;

	/*
	 * This controller controls 
	 */
	var UDS = Pane.extend({
		"init": function(app, feideconnect, vaktstore) {

			var that = this;
			this.app = app;
			this.feideconnect = feideconnect;
			this.vaktstore = vaktstore;

			this._super();
			dust.loadSource(dust.compile(template, "uds"));


			this.vaktstore.on("updated", this.proxy("updateData"));

			this.initLoad();

		},

		"initLoad": function() {
			var that = this;
			this.draw()
				.then(this.vaktstore.proxy("onLoaded"))
				// .then(this.app.freebusystore.proxy("onLoaded"))
				.then(this.proxy("updateData"))
				.then(this.proxy("_initLoaded"));

		},



		"load": function() {
			var group = this.app.getGroup();
			this.app.setHash('/uds');
			this.activate();
			this.app.setTopLevelPane("uds");
			this.updateData();
		},

		"draw": function(act) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var view = {"season": true};
				dust.render("uds", view, function(err, out) {
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

		"getUserRow": function(user) {
			var str = '<tr data-user="' + user.mail + '">' + 
				'<td class="user">' + user.name + '</td>';
			
			var week;

			var userCalendar = this.vacationstore.getUserCalendarByMail(user.mail);

			if (userCalendar !== null) {
				for(week = 0; week < 20; week++ ) {
					str += this.getUserWeek(userCalendar, week);
				}
			} else {
				str += '<td class="nodata" colspan="' + (5*17) + '">No data</td>';
				return '';
			}

			str += '</tr>';
			return str;
		},

		"updateData": function() {

			var i;
			var udsf = this.el.find('.udsf').eq(0).empty();
			var udsp = this.el.find('.udsp').eq(0).empty();

			var data = this.vaktstore.getSorted();
			// var data = this.vaktstore.entries;

			// console.error("data", data);

			for(i = 0; i < data.length; i++) {
				// console.error("Processing", data[i]);
				if (data[i].inPast()) {
					udsp.prepend(data[i].getView() );
				} else {
					udsf.append(data[i].getView() );
				}
				// udsp.append(data[i].getView() );
				// mh.append('<div>' + data[i].userid + '<pre>' + JSON.stringify(data[i], undefined, 2) + '</pre></div>');	
			}


		}


	}).extend(EventEmitter);

	return UDS;

});
