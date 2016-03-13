({
	baseUrl: "js",
	paths: {
		"bower": '../bower_components',
		"text": '../bower_components/text/text',
		"templates": '../templates/',
		"dust": '../bower_components/dustjs-linkedin/dist/dust-full',
		"class": "lib/class",
		"jquery": "../bower_components/jquery/dist/jquery.min",
		"moment": "../bower_components/momentjs/moment",
		"momentl": "../bower_components/momentjs/locale/nb",
		"momenttz": "../bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.min",
		"matchHeight": "../bower_components/matchHeight/jquery.matchHeight-min",
		"bootstrap": "../bower_components/bootstrap/dist/js/bootstrap"
	},
	shim: {
		"dust": {
			"deps": ["lib/definesetup"]
		},
		"bootstrap": {
			"deps": ['jquery'],
			"exports": "$.fn.popover"
		}
	},
	optimize: "none",
	name: "../bower_components/almond/almond",
	include: "main",
	insertRequire: ["main"],
	out: "dist/app.min.js"
})