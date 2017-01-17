(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');
    var colors = require('./colors');
    var cid = require('./cell').cid;

    function wipe() {
        d3.selectAll('#wfgrid tr').remove();
    }

    function Table(puzzle) {
        this.puzzle = puzzle;
        this.size = puzzle.size;
    }

    Table.prototype.getCell = function(x, y) {
        var td = d3.select('#' + cid(x, y));
        return td.datum();
    };

    Table.prototype.wordBetweenCells = function(cell0, cell1) {
        if (cell0.x===cell1.x && cell0.y===cell1.y) {
            return cell0.letter;
        }
        var parms = this.puzzle.grid.coordsToSlice(cell0.x, cell0.y, cell1.x, cell1.y);
        var word = this.puzzle.grid.readWord(parms[0], parms[1], parms[2], parms[3]);
        return word;
    };

    Table.prototype.markAnswer = function(answer, m) {
        var marked = [];
        var coords = answer.getCellCoordinates();
        for (var ci=0;  ci<coords.length; ci++) {
            var c = this.getCell(coords[ci].x, coords[ci].y);
            var sel = c.selection;
            if (!sel.empty() && sel.classed('cellsolved') !== m) {
                sel.classed('cellsolved', m);
            }
            marked.push(c);
        }
        return marked;
    };

    /*
     * Flash the first letter of this answer's word.
     */
    Table.prototype.flashHint = function(answer, tweent) {
        if (typeof tweent === 'undefined') {
            tweent = consts.FADE_TIME;
        }
        var cell = this.getCell(answer.startLocation.x, answer.startLocation.y);
        var cw = parseInt(cell.selection.style('width'), 10);
        cell.selection
            .transition('hintflash')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('background-color', colors.bodyText)
                .style('color', colors.bodyBg)
                .style('border-radius', cw + 'px')
            .transition('hintflash')
                .ease(d3.easeSinIn)
                .style('background-color', null)
                .style('color', null)
                .style('border-radius', null)
        ;
    };

    module.exports = {
        wipe: wipe,
        Table: Table
    };
}());
