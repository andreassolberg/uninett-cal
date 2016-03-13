define(function(require, exports, module) {


	var moment = require('moment');
	require('momentl');

	var GroupSelector = function(container, m) {
		var that = this;

		this.el = container;
		this.m = true;
		if (m === false) {
			this.m = false;
		}

		this.groups = null;
		this.selected = '_me';
		this.callback = null;



		this.el.on('click', '.group', function(e) {
			e.preventDefault();
			that.index += 1;
			var group = $(this).data('groupid');
			// console.log("Selected group ", group);
			that.selected = group;
			that.updateDisplay();

			setTimeout(function() {
				that.emit(group);
			}, 2)

		});

	};


	GroupSelector.prototype.set = function(selectedGroup) {
		if (typeof selectedGroup !== "undefined") {
			this.selected = selectedGroup;
		}
	};

	GroupSelector.prototype.getSelected = function() {
		return this.selected;
	};
	GroupSelector.prototype.on = function(callback) {
		this.callback = callback;
	};
	GroupSelector.prototype.emit = function(a) {
		if (typeof this.callback === 'function') {
			this.callback(a);
		}
	};


	GroupSelector.prototype.display = function(groups) {

		this.groups = groups;
		// console.error("SELEL", this.el.find(".groupselector").eq());
		var selel = this.el.find(".groupselector").eq(0);
		var gs = selel.empty();
		var icon;
		gs.append('<div class="list-group-item" ><input style="margin-left: 3px; margin-right: 3px" type="checkbox" id="showmeetingroom"> <label style="margin: 0px" for="showmeetingroom">Vis møterom</label></div>');
		gs.append('<a class="list-group-item active group" data-groupid="_all"  href="#!/"><span class="fa fa-home fa-fw"></span> Alle ansatte</a>');
		gs.append('<a class="list-group-item active group" data-groupid="_custom"  href="#!/"><span class="fa fa-star fa-fw"></span> Tilpasset liste</a>');
		gs.append('<a class="list-group-item group" data-groupid="_me" href="#!/"><span class="fa fa-user fa-fw"></span> Kun meg</a>');

		// if (this.m) {
		// 	gs.append('<a class="list-group-item group" data-groupid="_res" href="#!/"><span style="color: #060" class="fa fa-building fa-fw"></span> Møterom</a>');	
		// }

		for (var key in this.groups) {
			icon = '<span class="fa fa-users fa-fw"></span>';
			if (this.groups[key].member) {
				if (this.selected === '_me') {
					this.selected = key;
				}
				icon = '<span style="color: #900" class="fa fa-heart fa-fw"></span>';
			}
			gs.append('<a class="list-group-item group" data-groupid="' + key + '" href="#!/group/' + key + '">' + icon + ' ' + this.groups[key].title + '</a>');
		}
		this.updateDisplay();

	};

	GroupSelector.prototype.updateDisplay = function() {
		var that = this;
		var selel = this.el.find(".groupselector").eq(0);
		selel.find("a.group").each(function(i, item) {


			// console.log("comparing ", $(item),  $(item).data('groupid'), 'with ', that.selected);
			// console.log("Updating display for item ", li);
			if ($(item).data('groupid') === that.selected) {
				$(item).addClass('active');
			} else {
				$(item).removeClass('active');
			}
		});
	};

	return GroupSelector;

});