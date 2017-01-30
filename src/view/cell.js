(function() {
    'use strict';

    var d3 = require('d3');
    var viewutil = require('./viewutil');

    function cid(x, y) {
        return 'c'+x+'_'+y;
    }

    function Cell(s, x, y) {
        this.selection = null;
        this.letter = s;
        this.x = x;
        this.y = y;
        this.borderSize = 0;
    }

    Cell.prototype.id = function() {
        return cid(this.x, this.y);
    };

    Cell.prototype.setSelection = function() {
        this.selection = d3.select('#' + this.id());
    };

    Cell.prototype.getPagePosition = function() {
        if (!this.selection) {
            this.setSelection();
        }
        var p = this.selection.node().getBoundingClientRect();
        return {x: p.left, y: p.top};
    };

    Cell.prototype.resize = function() {
        if (!this.selection) {
            this.setSelection();
        }
        this.selection
            .style('font-size', viewutil.metrics.cell.fontSize + 'px')
            .style('width', viewutil.metrics.cell.size + 'px')
            .style('height', viewutil.metrics.cell.size + 'px')
        ;
        this.selection.select('.gc')
            .style('top', viewutil.metrics.cell.contentOffset + 'px')
        ;
    };

    Cell.prototype.flashHint = function(tweent) {
        tweent = viewutil.fadeTime(tweent);
        var cw = parseFloat(this.selection.style('width'));
        this.selection
            .style('border-radius', cw + 'px')
            .transition('cell.hint')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('background-color', viewutil.metrics.color.highlight)
                .style('color', viewutil.metrics.color.fg)
            .transition('cell.hint')
                .ease(d3.easeSinIn)
                .style('background-color', null)
                .style('color', null)
                .on('end', function() {
                    d3.select(this).style('border-radius', null);
                })
        ;
    };

    Cell.prototype.flashVictory = function(tweent, delayt) {
        tweent = viewutil.fadeTime(tweent);
        delayt = viewutil.fadeTime(delayt);
        this.selection
            .transition('cell.victory')
                .duration(tweent)
                .delay(delayt)
                .ease(d3.easeSinIn)
                .style('color', viewutil.metrics.color.fg)
            .transition('victory')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('color', null)
        ;
    };

    Cell.prototype.fadeVictory = function(tweent, delayt) {
        tweent = viewutil.fadeTime(tweent);
        delayt = viewutil.fadeTime(delayt);
        this.selection.transition('cell.victory')
            .duration(tweent)
            .delay(delayt)
            .ease(d3.easeSinOut)
            .style('color', viewutil.metrics.color.bg)
        ;
    };

    module.exports = {
        cid: cid,
        Cell: Cell
    };
}());
