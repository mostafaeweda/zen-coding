/**
 * Controller for Emmet for Ace plugin: handles user interaction
 * and calls Emmet commands
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('ace_editor', function(require, _) {
    var keymap = {
        'Ctrl-E': 'expand_abbreviation',
        'Tab': 'expand_abbreviation',
        'Ctrl-D': 'match_pair_outward',
        'Shift-Ctrl-D': 'match_pair_inward',
        'Shift-Ctrl-A': 'wrap_with_abbreviation',
        'Ctrl-Alt-N': 'next_edit_point',
        'Ctrl-Alt-P': 'prev_edit_point',
        'Ctrl-L': 'select_line',
        'Ctrl-Shift-M': 'merge_lines',
        'Ctrl-/': 'toggle_comment',
        'Ctrl-J': 'split_join_tag',
        'Ctrl-K': 'remove_tag',
        'Shift-Ctrl-Y': 'evaluate_math_expression',

        'Ctrl-Up': 'increment_number_by_1',
        'Ctrl-Down': 'decrement_number_by_1',
        'Alt-Up': 'increment_number_by_01',
        'Alt-Down': 'decrement_number_by_01',
        'Ctrl-Alt-Up': 'increment_number_by_10',
        'Ctrl-Alt-Down': 'decrement_number_by_10',

        'Ctrl-.': 'select_next_item',
        'Ctrl-,': 'select_previous_item',
        'Ctrl-Shift-B': 'reflect_css_value',

        'Enter': 'insert_formatted_line_break'
    };

    var defaultOptions = {
        profile: 'xhtml',
        syntax: 'html',
        use_tab: false,
        pretty_break: false
    };

	var keyboardShortcuts = {};
    var options = {};

    /**
     * Get Emmet options from element's class name
     */
    function getOptionsFromContext() {
        var paramStr = require('editor').getContext().className || '';
        var reParam = /\bemmet\-(\w+)\-(\w+)/g;
        var result = copyOptions(options);
        var m;

        while ( (m = reParam.exec(paramStr)) ) {
            var key = m[1].toLowerCase(),
                value = m[2].toLowerCase();

            if (value == 'true' || value == 'yes' || value == '1')
                value = true;
            else if (value == 'false' || value == 'no' || value == '0')
                value = false;

            result[key] = value;
        }

        return result;
    }

    function getOption(name) {
        return getOptionsFromContext()[name];
    }

    function copyOptions(opt) {
        return _.extend({}, defaultOptions, opt || {});
    }

    /**
     * Runs actions called by user
     * @param {Event} evt Event object
     */
    function runAction(actionName) {
        switch (actionName) {
            case 'expand_abbreviation':
                if (getOption('use_tab'))
                    actionName = 'expand_abbreviation_with_tab';
                else
                    // user pressed Tab key but it's forbidden in
                    // Emmet: bubble up event
                    return false;
                break;
            case 'insert_formatted_line_break':
                if (!getOption('pretty_break')) {
                    // user pressed Enter but it's forbidden in
                    // Emmet: bubble up event
                    return false;
                }
                break;
        }
        require('actions').run(actionName, require('editor'));
    }

    options = copyOptions();

    return {
        /**
         * Custom editor method: set default options (like syntax, tabs,
         * etc.) for editor
         * @param {Object} opt
         */
        setOptions: function(opt) {
            options = copyOptions(opt);
        },

        /**
         * Custom method: returns current context's option value
         * @param {String} name Option name
         * @return {String}
         */
        getOption: getOption,

        addShortcut: function (keystroke, actionName) {
        	var ace = require("editor").getContext();
	    	ace.commands.addCommand({
	    		bindKey: {win: keystroke, mac: keystroke},
	    		name: actionName,
	    		exec: function (ace) {
	    			runAction(actionName);
	    		}
	    	});
	    	keyboardShortcuts[keystroke.toLowerCase()] = actionName;
        },

        /**
		 * Removes shortcut binding
		 * @param {String} keystroke
		 */
		unbindShortcut: function(keystroke) {
			var ace = require("editor").getContext();
			keystroke = keystroke.toLowerCase();
			if (keystroke in keyboardShortcuts) {
				ace.commands.removeCommand(keyboardShortcuts[keystroke]);
				delete keyboardShortcuts[keystroke];
			}
		},

        /**
         * Returns array of binded actions and their keystrokes
         * @return {Array}
         */
        getShortcuts: function() {
            var actions = require('actions');
            return _.compact(_.map(keyboardShortcuts, function(action, key) {
                var keyLower = key.toLowerCase();

                // skip some internal bindings
                if (keyLower == 'tab' || keyLower == 'enter')
                    return;

                return {
                    keystroke: key,
                    label: _.last((actions.get(action).options.label || action).split('/')),
                    action: action
                };
            }));
        },

        getInfo: function() {
            var message = 'This Ace on this page are powered by Emmet toolkit.\n\n' +
                    'Available shortcuts:\n';
            var actions = _.map(this.getShortcuts(), function(shortcut) {
                return shortcut.keystroke + ' — ' + shortcut.label;
            });

            message += actions.join('\n') + '\n\n';
            message += 'More info on http://emmet.io/';

            return message;
        },

        /**
         * Show info window about Emmet
         */
        showInfo: function() {
            alert(this.getInfo());
        },

        /**
         * Setup editor. Pass object with values defined in
         * <code>default_options</code>
         */
        setup: function(opt) {
        	var _self = this;
            require('editor').setContext(opt.editor);
            this.setOptions(opt);
            _.each(keymap, function(actionName, keystroke) {
		        _self.addShortcut(keystroke, actionName);
		    });
        }
    };
});