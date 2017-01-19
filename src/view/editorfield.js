(function() {
    'use strict';

    var d3 = require('d3');
    var data = require('../model/data');
    var colors = require('./colors');

    function Field(i, word, cbpi) {
        this.index = i;
        this.word = word;
        this.editing = false;
        this.valid = true;
        this.input = null;
        this.label = null;
        this.labelPosOffset = 0;
        this.cbPostInput = cbpi;
        // these get set by the editor
        this.minlen = 3;
        this.maxlen = 8;
    }

    Field.prototype.id = function() {
        return 'listitem' + this.index;
    };

    Field.prototype.setValid = function(v, msg) {
        if (!this.selection) {
            this.selection = d3.select('#'+this.id());
        }
        this.valid = v;
        if (this.valid) {
            if (this.label && !this.label.empty()) {
                this.selection.select('label').remove();
                this.label = null;
            }
            this.selection.select('input').style('background-color', null);
            this.selection.select('input').style('color', null);
        } else {
            this.selection.select('input').style('background-color', colors.warningText);
            this.selection.select('input').style('color', colors.bodyText);
            if (!this.label || this.label.empty()) {
                this.label = this.selection.append('label')
                    .classed('warning', true)
                    .on('click', function() {
                        var input = d3.select(this.parentNode).select('input');
                        var insertPoint = input.property('value').length;
                        input.node().focus();
                        input.node().selectionStart = insertPoint;
                        input.node().selectionEnd = insertPoint;
                    })
                ;
                this.labelPosOffset = parseFloat(this.label.style('right'));
            }
            this.label.text(msg);
            this.fixLabelPosition();
        }
    };

    Field.prototype.validate = function() {
        if (!this.selection) {
            this.selection = d3.select('#'+this.id());
        }
        var word = this.selection.select('input').property('value');

        if (data.getBlacklist().indexOf(word) !== -1) {
            this.setValid(false, 'Keep it clean.');
            return false;
        }
        if (word.length < this.minlen) {
            this.setValid(false, 'Need '+this.minlen+' or more letters.');
            return false;
        }
        if (word.length > this.maxlen) {
            this.setValid(false, 'Need ' + this.maxlen + ' or fewer letters.');
            return false;
        }

        this.setValid(true);
        return true;
    };

    Field.prototype.onInput = function() {
        if (!this.selection) {
            this.selection = d3.select('#'+this.id());
        }
        var input = this.selection.select('input');
        var insertPoint = input.node().selectionStart;
        var inword = input.property('value');
        var clean = inword.toUpperCase().replace(/[^A-Za-z]/g, '');
        if (clean !== inword) {
            input.property('value', clean);
            input.node().selectionStart = insertPoint;
            input.node().selectionEnd = insertPoint;
        }
        if (this.validate()) {
            this.word = clean;
        }
        if (this.cbPostInput) {
            this.cbPostInput(this);
        }
    };

    Field.prototype.fixLabelPosition = function() {
        if (!this.label || this.label.empty()) {
            return;
        }
        var curr = parseFloat(this.label.style('right'));
        var li = d3.select(this.label.node().parentNode);
        var input = li.select('input');
        var bli = li.node().getBoundingClientRect();
        var binput = input.node().getBoundingClientRect();
        var newr = bli.right - binput.right + this.labelPosOffset;

        // The precision slippage here isn't a floating point problem, it's a
        // css problem. Let's just say that differences of less than 0.1px
        // aren't enough to worry about.
        if (curr.toFixed(1) !== newr.toFixed(1)) {
            this.label.style('right', newr + 'px');
        }
    };

    // ==================================================================

    module.exports = {
        Field: Field
    };
}());
