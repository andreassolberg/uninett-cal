

define(function (require, exports, module) {

	"use strict";


	var
		dust = require('dust'),
		FeideConnect = require('bower/feideconnectjs/src/FeideConnect').FeideConnect,
		AppController = require('./controllers/AppController'),

		UDS= require('./controllers/UDS'),
		FreeBusyController = require('./controllers/FreeBusyController'),
		CurrentAvailability = require('./controllers/CurrentAvailability'),
		ContactsController = require('./controllers/ContactsController'),
		VacationController = require('./controllers/VacationController'),
		ErrorsController = require('./controllers/ErrorsController'),

		VaktStore = require('./stores/VaktStore'),
		VacationStore = require('./stores/VacationStore'),
		FreeBusyStore = require('./stores/FreeBusyStore'),
		GroupSelector = require('./GroupSelector'),


		Event = require('./models/Event'),


		PaneController = require('./controllers/PaneController'),

		utils  = require('./utils'),
		rawconfig = require('text!../../etc/config.js'),
		moment = require('moment'),
		$ = require('jquery');

	require("momenttz");
	moment.locale("nb");


	var tmpHeader = require('text!templates/header.html');
	var tmpFooter = require('text!templates/footer.html');

	require('../../bower_components/bootstrap/dist/js/bootstrap.min.js');
	

	/**
	 * Here is what happens when the page loads:
	 *
	 * Check for existing authentication.
	 * When authenticated setup clientpool.
	 * After that, check routing...
	 * Load frontpage
	 * 
	 * 
	 */

	var App = AppController.extend({
		
		"init": function() {
			var that = this;

			var config = JSON.parse(rawconfig);
			// console.log("Feide Connect config", config);
			this.feideconnect = new FeideConnect(config);

			// console.error("Dust", dust);

			dust.loadSource(dust.compile(tmpHeader, "header"));
			dust.loadSource(dust.compile(tmpFooter, "footer"));

			// Call contructor of the AppController(). Takes no parameters.
			this._super();
			this.topLevelPane = null;


			this.currentVersion = null;
			setInterval(function() {
				that.checkVersion();
			}, 45*1000);
		
			
			// console.error("TZ .---- ");
			// console.log( Event.getNow().format() );


 			this.groupselector = new GroupSelector(this.el, true);
			// this.groupselector.set(selectedGroup);	
			// this.groupselector.on(function(sel) {
			// 	// that.freebusyco
			// 	// that.app.setHash('/freebusy/group/' + sel);
			// 	// that.updateData();
			// 	// 
			// });




			this.freebusystore = new FreeBusyStore(this.feideconnect);



			this.freebusystore.on("updated", function() {

			});
			this.freebusystore.onLoaded().then(function() {
				// console.error(" FreeBusyStore got data", that.freebusystore.getUsers() );
				var groups = that.freebusystore.getGroups();
				that.groupselector.display(groups);
			});

			this.vaktstore = new VaktStore(this.feideconnect);

			this.vacationstore = new VacationStore(this.feideconnect);

			// this.vacationstore.on("updated", function() {

			// });
			// this.vacationstore.onLoaded().then(function() {
			// 	console.error(" VacationData got data", that.freebusystore.getUsers() );
			// 	var groups = that.freebusystore.getGroups();
			// 	that.groupselector.display(groups);
			// });




			this.pc = new PaneController(this.el.find('#panecontainer'));

			this.freebusy = new FreeBusyController(this, this.feideconnect, this.freebusystore);
			this.pc.add(this.freebusy);

			this.groupselector.on(function(sel) {

				if (that.freebusy.isActive) {
					that.freebusy.setGroup(sel);	
					that.freebusy.updateData();
				}
				if (that.vacation.isActive) {
					that.vacation.setGroup(sel);
					that.vacation.updateData();
				}
				if (that.currentAvailability.isActive) {
					that.currentAvailability.setGroup(sel);
					that.currentAvailability.updateData();
				}
				
			});



			this.currentAvailability = new CurrentAvailability(this, this.feideconnect, this.freebusystore);
			this.pc.add(this.currentAvailability);

			this.vacation = new VacationController(this, this.feideconnect, this.vacationstore);
			this.pc.add(this.vacation);

			this.contacts = new ContactsController(this.feideconnect);
			this.pc.add(this.contacts);

			this.uds = new UDS(this, this.feideconnect, this.vaktstore);
			this.pc.add(this.uds);

			this.errorscontroller = new ErrorsController(this, this.feideconnect);
			this.pc.add(this.errorscontroller);


			this.setupRoute(/^\/$/, "routeCurrent");
			this.setupRoute(/^\/freebusy\/group\/([a-zA-Z0-9_\-:]+)$/, "routeMainlisting");
			this.setupRoute(/^\/current\/group\/([a-zA-Z0-9_\-:]+)$/, "routeCurrent");
			this.setupRoute(/^\/current\/group\/([a-zA-Z0-9_\-:]+)\/fullscreen$/, "routeCurrentFullscreen");
			this.setupRoute(/^\/ferie\/group\/([a-zA-Z0-9_\-:]+)$/, "routeVacationListing");
			this.setupRoute(/^\/ferie$/, "routeVacationListing");
			this.setupRoute(/^\/uds$/, "routeUDS");
			this.setupRoute(/^\/errors$/, "routeErrors");

			// this.feideconnect.authenticate();


			this.pc.debug();

			// this.route();


			this.draw();	

			// that.feideconnect.authenticate();



			$("body").on("click", ".actPaneSelector", function(e) {
				e.preventDefault();
				var ct = $(e.currentTarget);
				var cp = ct.parent();
				var t = ct.attr("id");

				if (t === 'contacts') {
					that.setTopLevelPane("contacts");
					that.contacts.load();
					that.setContainerWidth(false);
				} else if (t === 'errors') {
					that.setTopLevelPane("errors");
					that.errorscontroller.load();
					that.setContainerWidth(false);
				} else if (t === 'vacation') {
					that.setTopLevelPane("vacation");
					that.vacation.load();
					that.setContainerWidth(true);
				} else if (t === 'uds') {
					that.setTopLevelPane("uds");
					that.uds.load();
					that.setContainerWidth(false);
				} else if (t === 'currentAvailability') {
					that.setTopLevelPane("currentAvailability");
					that.currentAvailability.load();
					that.setContainerWidth(true);
				} else {
					that.setContainerWidth(false);
					that.setTopLevelPane("freebusy");
					that.freebusy.load();
				}

			});



			this.el.on("click", "#logout", function() {
				that.feideconnect.logout();
				setTimeout(function() {

					var c = that.feideconnect.getConfig();
					var url = c.apis.auth + '/logout';
					// console.error("Redirect to " + url);
					window.location = url;

				}, 200);
			});








			this.feideconnect.onAuthenticated()
				.then(that.proxy("onLoaded"))
				.then(function() {
					var user = that.feideconnect.getUser();
					$("body").addClass("stateLoggedIn");
					$("body").removeClass("stateLoggedOut");

					$("#username").empty().text(user.name);
					$("#profilephoto").html('<img style="margin-top: -28px; max-height: 48px; max-width: 48px; border: 0px solid #b6b6b6; border-radius: 32px; box-shadow: 1px 1px 4px #aaa;" src="https://auth.feideconnect.no/user/media/' + user.profilephoto + '" alt="Profile photo" />');

					$(".loader-hideOnLoad").hide();
					$(".loader-showOnLoad").show();

					that.updateTopLevelPane();
					that.route();


				})
						



		},

		"setContainerWidth": function(fluid) {
			if (fluid) {
				$("#allContent").removeClass("container").addClass("container-fluid");
			} else {
				$("#allContent").removeClass("container-fluid").addClass("container");
			}
		},

		"updateTopLevelPane": function() {
			var x = this.topLevelPane;
			$(".actPaneSelector").each(function(i, item) {
				var c = $(item).attr("id");
				// console.error("Comparing ", c, x);
				if (c === x) {
					$(item).addClass("active");
				} else {
					$(item).removeClass("active");
				}
			});
		},

		"setTopLevelPane": function(x) {
			// console.error("setTopLevelPane", x);
			this.topLevelPane = x;
			this.updateTopLevelPane();
		},

		"getGroup": function() {
			return this.groupselector.getSelected();
		},

		"checkVersion": function() {
			var that = this;
			$.getJSON('etc/version.js', function(data) {
				// console.error("Version check is ", data.version);

				if (that.currentVersion === null) {
					that.currentVersion = data.version;
					return false;
				}

				if (that.currentVersion !== data.version) {
					return that.reloadPage();
				}


			});


		},


		"reloadPage": function() {
			location.reload();
		},

		/**
		 * A draw function that draws the header and footer template.
		 * Supports promises
		 * @return {[type]} [description]
		 */
		"draw": function() {
			var that = this;

			var view = {
			};

			this.loaded = false;
			return Promise.all([
				new Promise(function(resolve, reject) {
					dust.render("header", view, function(err, out) {
						if (err) { return reject(err); }
						that.el.find("#header").append(out);
						resolve();
					});
				}),
				new Promise(function(resolve, reject) {
					dust.render("footer", view, function(err, out) {
						if (err) { return reject(err); }
						that.el.find("#footer").append(out);
						resolve();
					});
				})
			]).then(function() {
				that.loaded = true;
				if (that._onloadedCallback && typeof that._onloadedCallback === 'function') {
					that._onloadedCallback();
				}
			});
		},



		"onLoaded": function() {
			var that = this;
			return new Promise(function(resolve, reject) {
				if (that.loaded) {
					resolve();
				} else {
					that._onloadedCallback = resolve;
				}
			});
		},





		"setErrorMessage": function(title, type, msg) {

			var that = this;
			type = (type ? type : "danger");

			// console.error("Error ", title, type, typeof msg, msg);

			var pmsg = '';
			if (typeof msg === 'object' && msg.hasOwnProperty("message")) {
				pmsg = '<p>' + utils.escape(msg.message, false).replace("\n", "<br />") + '</p>';
			} else if (typeof msg === 'string') {
				pmsg = '<p>' + utils.escape(msg, false).replace("\n", "<br />") + '</p>';
			}

			var str = '<div class="alert alert-' + type + ' alert-dismissible" role="alert">' +  
				' <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
				(title ? '<strong>' + utils.escape(title, false).replace("\n", "<br />")  + '</strong>' : '') +
				pmsg + 
				'</div>';

			if (this.hasOwnProperty("errorClearCallback")) {
				clearTimeout(this.errorClearCallback);
			}

			this.errorClearCallback = setTimeout(function() {
				$("#errorcontainer").empty();
			}, 10000);

			$("#errorcontainer").empty().append(str);

		},


		"routeVacationListing": function(x) {
			this.setContainerWidth(true);
			this.vacation.activate();
			this.vacation.setGroup(x);
			this.groupselector.set(x);
			this.setTopLevelPane("vacation");

		},
		"routeUDS": function(x) {
			this.setContainerWidth(true);
			this.uds.activate();
			// this.groupselector.set(x);
			this.setTopLevelPane("uds");

		},

		"routeErrors": function(x) {
			this.setContainerWidth(false);
			this.errorscontroller.load();
			this.setTopLevelPane("errors");

		},
		"routeMainlisting": function(x) {

			this.freebusy.activate();
			this.setTopLevelPane("freebusy");
			if (typeof x !== "undefined") {
				this.freebusy.setGroup(x);
				this.groupselector.set(x);
			}
		},
		"routeCurrentFullscreen": function(x) {
			$("body").css("padding-top", "0px");
			$("#header").hide();
			// $("#allContent").removeClass("gutter");
			$("#groupselector").hide();
			$("#mainOuter").removeClass("col-sm-9").addClass("col-sm-12");
			$("#mainNav").hide();

			console.log("About to set fullscreen " , true);
			this.currentAvailability.setFullscreen(true);
			this.routeCurrent(x);

		},
		"routeCurrent": function(x) {
			// console.error("Current");
			this.currentAvailability.activate();
			this.setTopLevelPane("currentAvailability");
			this.setContainerWidth(true);
			if (typeof x !== "undefined") {
				this.currentAvailability.setGroup(x);
				this.groupselector.set(x);
			}

		}



	});


	return App;
});
	