(function() {
    'use strict';

    var Random = require('random-js');
    var d3 = require('d3');
    var viewutil = require('./viewutil');
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
        tweent = viewutil.fadeTime(tweent);
        var cell = this.getCell(answer.startLocation.x, answer.startLocation.y);
        var cw = parseInt(cell.selection.style('width'), 10);
        cell.selection
            .style('border-radius', cw + 'px')
            .transition('hintflash')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('background-color', colors.bodyText)
                .style('color', colors.bodyBg)
            .transition('hintflash')
                .ease(d3.easeSinIn)
                .style('background-color', null)
                .style('color', null)
                .on('end', function() {
                    d3.select(this).style('border-radius', null);
                })
        ;
    };

    Table.prototype.flashVictory = function(ring, tweent) {
        tweent = viewutil.fadeTime(tweent);
        var coordlist = ring.answer.getCellCoordinates();
        d3.selectAll('.cell')
            .filter(function(d) {
                for (var i=0; i<coordlist.length; i++) {
                    if (coordlist[i].x===d.x && coordlist[i].y===d.y) {
                        return true;
                    }
                }
                return false;
            })
            .transition('victory')
                .duration(tweent)
                .delay(function(d) {
                    for (var i=0; i<coordlist.length; i++) {
                        if (coordlist[i].x===d.x && coordlist[i].y===d.y) {
                            return ((tweent / ring.answer.word.length) * i);
                        }
                    }
                    return 0;
                })
                .ease(d3.easeSinIn)
                .style('color', colors.bodyText)
            .transition('victory')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('color', null)
        ;
    };

    Table.prototype.fadeUnsolved = function(nwords, rng, tweent) {
        tweent = viewutil.fadeTime(tweent);
        d3.selectAll('.cell')
            .filter(function() {
                return !d3.select(this).classed('cellsolved');
            })
            .transition('victory')
                .duration(tweent)
                .delay(function() {
                    return Random.integer(0, tweent*nwords*2)(rng);
                })
                .ease(d3.easeSinOut)
                .style('color', colors.bodyBg)
        ;
    };

    module.exports = {
        wipe: wipe,
        Table: Table
    };
}());
