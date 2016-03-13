define(function(require, exports, module) {
	"use strict";	

	var 
		dust = require('dust'),
		Pane = require('./Pane'),
		EventEmitter = require('../EventEmitter'),
		utils = require('../utils'),
		$ = require('jquery'),

		template = require('text!templates/errors.html')
		;

	/*
	 * This controller controls 
	 */
	var ErrorsController = Pane.extend({
		"init": function(app, feideconnect) {
			this._super();
			this.app = app;
			this.feideconnect = feideconnect;
			this.errors = [];
			dust.loadSource(dust.compile(template, "errors"));
			this.loadData();
		},


		"load": function() {
			var that = this;
			this.loadData().then(function() {
				that.draw(true);
			});
			this.app.setHash('/errors');
		},



		"loadData": function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				$.getJSON("https://cal.uninett.no/api-vakt-now/errors", function(data) {
					that.errors = data;

					$("#ec").empty().append('<span class="label label-danger">' + data.length + '</span>');
					resolve(data);
				});
			});
		},
		
		"draw": function(act) {
			var that = this;
			var view = {
				"errors": this.errors
			};
			dust.render("errors", view, function(err, out) {
				// console.log("Got this", out);
				that.el.empty().append(out);
			});
			if (act) {
				this.activate();
			}

		}
	}).extend(EventEmitter);

	return ErrorsController;

});
