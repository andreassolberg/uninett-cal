/* jshint node: true */
module.exports = function(grunt) {

	"use strict";

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		config: grunt.file.readJSON('etc/config.js'),
		jslint: {
			app: {
				src: ['Gruntfile.js', 'js/**/*.js', 'test/**/*.js'],
			}
		},
		jshint: {
			files: [
				'Gruntfile.js', 'js/**/*.js', 'test/**/*.js',
				'!js/es6-promise.min.js'
			],
			options: {
				jshintrc: true,
				globals: {
					jQuery: true
				}
			}
		},
		shell: {
			rcss: {
				command: 'node_modules/requirejs/bin/r.js -o build.css.js'
			},
			rjs: {
				command: "node_modules/requirejs/bin/r.js -o build.js out=dist/app.min.js" // Will be overridden below, depending on languages config.
			},
			bower: {
				command: "node_modules/bower/bin/bower --allow-root install"
			}
		},
		watch: {
			files: ['<%= jshint.files %>'],
			tasks: ['jshint']
		},
		transifex: {
			"feide-connect": {
				options: {
					targetDir: "./dictionaries/transifex", // download specified resources / langs only
					resources: ["developer-dashboard"],
					languages: ["en_US", "fr"],
					filename: "dictionary._lang_.json"
						// templateFn: function(strings) { return strings; }  // customize the output file format (see below)
				}
			}
		}
	});

	// grunt.loadNpmTasks('grunt-jslint');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-transifex');

	// Tasks
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('bower', ['shell:bower']);
	grunt.registerTask('build', ['shell:bower', 'jshint', 'shell:rcss', 'shell:rjs']);
	grunt.registerTask('test', ['jshint']);

};