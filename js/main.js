"use strict";

requirejs.config({
	//By default load any module IDs from js/lib
	baseUrl: 'js',
	//except, if the module ID starts with "app",
	//load it from the js/app directory. paths
	//config is relative to the baseUrl, and
	//never includes a ".js" extension since
	//the paths config could be for a directory.
	paths: {
		"bower"     : '../bower_components',
		"text"      : '../bower_components/text/text',
		"templates" : '/templates/',
		"dust"      : '../bower_components/dustjs-linkedin/dist/dust-full',
		"class"     : "class",
		"jquery"	: "../bower_components/jquery/dist/jquery.min",
		"moment"    : "../bower_components/momentjs/moment",
		"momentl"   : "../bower_components/momentjs/locale/nb",
		"momenttz"  : "../bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min"
	},
    "shim": {
    }
});

if (typeof console === "undefined") {
    window.console = {
        log: function () {},
        error: function () {},
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


