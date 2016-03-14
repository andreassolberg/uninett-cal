"use strict";

requirejs.config({
	baseUrl: 'js',
	paths: {
		"bower": '../bower_components',
		"text": '../bower_components/text/text',
		"templates": '/templates/',
		"dust": '../bower_components/dustjs-linkedin/dist/dust-full',
		"class": "class",
		"jquery": "../bower_components/jquery/dist/jquery.min",
		"moment": "../bower_components/momentjs/moment",
		"momentl": "../bower_components/momentjs/locale/nb",
		"momenttz": "../bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min",
		"bootstrap": "../bower_components/bootstrap/dist/js/bootstrap",
		"es6-promise": "../bower_components/es6-promise/promise"
	},
	"shim": {
		"bootstrap": {
			"deps": ['jquery'],
			"exports": "$.fn.popover"
		}
	}
});


if (typeof console === "undefined") {
	window.console = {
		log: function() {},
		error: function() {},
	};
}

define(function(require, exports, module) {

	var
		x = require('lib/definesetup'),
		$ = require('jquery'),
		App = require('lib/App');

	$(document).ready(function() {
		var app = new App();
	});

});