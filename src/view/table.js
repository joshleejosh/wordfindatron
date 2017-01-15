(function() {
    'use strict';

    var d3 = require('d3');
    var cell = require('./cell');

    function Table(puzzle) {
        this.puzzle = puzzle;
        this.size = puzzle.size;
    }

    Table.prototype.getCell = function(r, c) {
        var td = d3.select('#' + cell.cid(r, c));
        return td.datum();
    };

    Table.prototype.wordBetweenCells = function(cell0, cell1) {
        if (cell0.row===cell1.row && cell0.column===cell1.column) {
            return cell0.letter;
        }
        var parms = this.puzzle.grid.coordsToSlice(cell0.column, cell0.row, cell1.column, cell1.row);
        var word = this.puzzle.grid.readWord(parms[0], parms[1], parms[2], parms[3]);
        return word;
    };

    Table.prototype.markAnswer = function(answer, m) {
        var marked = [];
        var coords = answer.getCellCoordinates();
        for (var ci=0;  ci<coords.length; ci++) {
            var c = this.getCell(coords[ci].y, coords[ci].x);
            var sel = d3.select('#' + c.id());
            if (!sel.empty() && sel.classed('cellsolved') !== m) {
                sel.classed('cellsolved', m);
            }
            marked.push(c);
        }
        return marked;
    };

    module.exports = {
        Table: Table
    };
}());
