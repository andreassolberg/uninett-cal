define(function(require, exports, module) {
	"use strict";	

	var 
		Model = require('./Model'),
		Event = require('./Event'),
		moment = require('moment')
		;


	var debug = 2;

	var UserCalendarCurrent = Model.extend({
		"init": function(user, cal, now, near, next) {
			this.user = user;
			this.cal = cal;

			this.now = now;
			this.near = near;
			this.next = next;

			this.status = "free";
			if (this.now.length > 0) {
				this.status = "busy";
			} else if (this.near.length > 0) {
				this.status = "near";
			} else if (this.next.length > 0) {
				this.status = "next";
			}

		},

		"getSortableValue": function() {
			if (this.status === 'busy') {
				return 5;
			} else if (this.status === 'near') {
				return 3;
			} else if (this.status === 'next') {
				return 2;
			} else if (this.status === 'free') {
				return 0;
			} else {
				return 0;
			}

		}

	});

	UserCalendarCurrent.sorter = function(a, b) {
		return b.getSortableValue() - a.getSortableValue();
	}

	UserCalendarCurrent.sort = function(list) {

		return list.sort(UserCalendarCurrent.sorter);

	};

	return UserCalendarCurrent;






});

