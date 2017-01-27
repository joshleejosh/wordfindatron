(function() {
    'use strict';

    var Random = require('random-js');
    var d3 = require('d3');
    var viewutil = require('./viewutil');
    var cell = require('./cell');

    function wipe() {
        d3.selectAll('#wfgrid tr').remove();
    }

    function Table(puzzle) {
        this.puzzle = puzzle;
        this.size = puzzle.size;
    }

    Table.prototype.getCell = function(x, y) {
        var td = d3.select('#' + cell.cid(x, y));
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

    Table.prototype.rebind = function(onDragStart, onDragMove, onDragEnd) {
        var rows = d3.select('#wfgrid tbody').selectAll('tr')
            .data(this.puzzle.grid.grid)
            .enter()
            .append('tr')
        ;

        var r = 0;
        var cells = rows.selectAll('td')
            .data(function(row) {
                var c = 0;
                var rv = row.map(function(s) {
                    return new cell.Cell(s, c++, r);
                });
                r++;
                return rv;
            })
            .enter()
            .append('td')
            .attr('id', function(d) { return d.id(); })
            .classed('cell', true)
        ;

        cells.call(d3.drag()
            .on('start', onDragStart)
            .on('drag', onDragMove)
            .on('end', onDragEnd)
        );
        cells.append('div')
            .classed('gc', true)
            .text(function(d) { return d.letter; })
        ;
    };

    Table.prototype.resize = function() {
        d3.select('#wfgrid')
            .style('max-width', viewutil.metrics.table.size + 'px')
            .style('width', viewutil.metrics.table.size + 'px');
        d3.selectAll('#wfgrid td.cell').each(function(c) {
            c.resize();
        });
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

    Table.prototype.flashHint = function(answer, tweent) {
        var c = this.getCell(answer.startLocation.x, answer.startLocation.y);
        c.flashHint(tweent);
    };

    Table.prototype.flashVictory = function(ring, tweent) {
        tweent = viewutil.fadeTime(tweent);
        var coordlist = ring.answer.getCellCoordinates();
        d3.selectAll('.cell')
            .filter(function(c) {
                for (var i=0; i<coordlist.length; i++) {
                    if (coordlist[i].x===c.x && coordlist[i].y===c.y) {
                        c.flashIndex = i;
                        return true;
                    }
                }
                return false;
            })
            .each(function (c) {
                var delayt = ((tweent / ring.answer.word.length) * c.flashIndex);
                c.flashVictory(tweent, delayt);
            })
        ;
    };

    Table.prototype.fadeUnsolved = function(nwords, rng, tweent) {
        d3.selectAll('.cell')
            .filter(function() {
                return !d3.select(this).classed('cellsolved');
            })
            .each(function (c) {
                var delayt = Random.integer(0, tweent * nwords * 2)(rng);
                c.fadeVictory(tweent, delayt);
            })
        ;
    };

    module.exports = {
        wipe: wipe,
        Table: Table
    };
}());
