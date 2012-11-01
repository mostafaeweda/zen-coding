/**
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 * @constructor
 * @memberOf __emmetEditorAce
 * @param {Function} require
 * @param {Underscore} _
 */
emmet.define('editor', function(require, _) {
    /** @param {Element} Source element */
    var editor = null;
    var doc = null;

    function toOffset(cursorPos) {
        var offset = 0, newLineLength = doc.getNewLineCharacter().length;
        var prevLines = doc.getLines(0, cursorPos.row - 1);

        for (var i=0; i < prevLines.length; i++) {
            offset += prevLines[i].length;
            offset += newLineLength;
        }
        offset += cursorPos.column;

        return offset;
    };

    function fromOffset(offset) {
        var newLineLength = doc.getNewLineCharacter().length;
        var row = 0;
        var column = 0;
        while (offset > 0) {
            offset -= doc.getLine(row++).length;
            offset -= newLineLength; // consider the new line character(s)
        }
        if (offset < 0) {
            row--;
            offset += newLineLength; // add the new line again
            column = doc.getLine(row).length + offset;
        }
        return {
            row: row,
            column: column
        };
    };

    tx = null;

    return {
        setContext: function(ace) {
            editor = ace;
            doc = editor.session.getDocument();
            require('utils').setNewline(doc.getNewLineCharacter());
        },

        getContext: function() {
            return editor;
        },

        getSelectionRange: function() {
            var range =  editor.session.selection.getRange();
            return {
                start: toOffset(range.start),
                end: toOffset(range.end)
            };
        },

        /**
         * Creates text selection on target element
         * @param {Number} start
         * @param {Number} end
         */
        createSelection: function(start, end) {
            start = fromOffset(start);
            end = end ? fromOffset(end) : start;
            editor.selection.setRange({
                start: start,
                end: end
            });
        },

        /**
         * Returns current line's start and end indexes
         */
        getCurrentLineRange: function() {
            var caretPos = this.getCaretPos();
            if (caretPos === null) return null;
            return require('utils').findNewlineBounds(this.getContent(), caretPos);
        },

        /**
         * Returns current caret position
         * @return {Number}
         */
        getCaretPos: function() {
            return toOffset(editor.getCursorPosition());
        },

        /**
         * Set new caret position
         * @param {Number} pos Caret position
         */
        setCaretPos: function(pos) {
            this.createSelection(pos);
        },

        /**
         * Returns content of current line
         * @return {String}
         */
        getCurrentLine: function() {
            var range = this.getCurrentLineRange();
            return range.start < range.end ? this.getContent().substring(range.start, range.end) : '';
        },

        /**
         * Replace editor's content or it's part (from <code>start</code> to
         * <code>end</code> index). If <code>value</code> contains
         * <code>caret_placeholder</code>, the editor will put caret into
         * this position. If you skip <code>start</code> and <code>end</code>
         * arguments, the whole target's content will be replaced with
         * <code>value</code>.
         *
         * If you pass <code>start</code> argument only,
         * the <code>value</code> will be placed at <code>start</code> string
         * index of current content.
         *
         * If you pass <code>start</code> and <code>end</code> arguments,
         * the corresponding substring of current target's content will be
         * replaced with <code>value</code>.
         * @param {String} value Content you want to paste
         * @param {Number} start Start index of editor's content
         * @param {Number} end End index of editor's content
         * @param {Boolean} noIndent Do not auto indent <code>value</code>
         */
        replaceContent: function(value, start, end, noIndent) {
            var content = this.getContent();
            var utils = require('utils');

            if (_.isUndefined(end))
                end = _.isUndefined(start) ? content.length : start;
            if (_.isUndefined(start)) start = 0;

            // indent new value
            if (!noIndent) {
                value = utils.padString(value, utils.getLinePaddingFromPosition(content, start));
            }

            // find new caret position
            var tabstopData = emmet.require('tabStops').extract(value, {
                escape: function(ch) {
                    return ch;
                }
            });
            value = tabstopData.text;

            var firstTabStop = tabstopData.tabstops[0];
            if (firstTabStop) {
                firstTabStop.start += start;
                firstTabStop.end += start;
            } else {
                firstTabStop = {
                    start: value.length + start,
                    end: value.length + start
                };
            }

            try {
                doc.setValue(utils.replaceSubstring(content, value, start, end));
                this.createSelection(firstTabStop.start, firstTabStop.end);
            } catch(e){}
        },

        /**
         * Returns editor's content
         * @return {String}
         */
        getContent: function() {
            return doc.getValue();
        },

        /**
         * Returns current editor's syntax mode
         * @return {String}
         */
        getSyntax: function(){
            var syntax = editor.session.syntax;
            var caretPos = this.getCaretPos();

            if (syntax == 'html') {
                // get the context tag
                var pair = require('html_matcher').getTags(this.getContent(), caretPos);
                if (pair && pair[0] && pair[0].type == 'tag' && pair[0].name.toLowerCase() == 'style') {
                    // check that we're actually inside the tag
                    if (pair[0].end <= caretPos && pair[1].start >= caretPos)
                        syntax = 'css';
                }
            }
            return syntax;
        },

        /**
         * Returns current output profile name (@see emmet#setupProfile)
         * @return {String}
         */
        getProfileName: function() {
            return require('ace_editor').getOption('profile');
        },

        /**
         * Ask user to enter something
         * @param {String} title Dialog title
         * @return {String} Entered data
         * @since 0.65
         */
        prompt: function(title) {
            return prompt(title);
        },

        /**
         * Returns current selection
         * @return {String}
         * @since 0.65
         */
        getSelection: function() {
            var sel = this.getSelectionRange();
            if (sel) {
                try {
                    return this.getContent().substring(sel.start, sel.end);
                } catch(e) {}
            }

            return '';
        },

        /**
         * Returns current editor's file path
         * @return {String}
         * @since 0.65
         */
        getFilePath: function() {
            return location.href;
        }
    };
});
 