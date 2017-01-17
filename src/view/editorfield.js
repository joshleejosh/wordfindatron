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
        this.cbPostInput = cbpi;
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
            if (!this.selection.select('label').empty()) {
                this.selection.select('label').remove();
            }
            this.selection.select('input').style('background-color', null);
            this.selection.select('input').style('color', null);
        } else {
            this.selection.select('input').style('background-color', colors.warningText);
            this.selection.select('input').style('color', colors.bodyBg);
            if (this.selection.select('label').empty()) {
                this.selection.append('label').classed('warning', true);
            }
            this.selection.select('label').text(msg);
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
        if (word.length < 3) {
            this.setValid(false, 'Need three or more letters.');
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

    // ==================================================================

    module.exports = {
        Field: Field
    };
}());
