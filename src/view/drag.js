(function() {
    'use strict';

    var d3 = require('d3');
    var util = require('../util');
    var ring = require('./ring');

    var dragRing;

    function dragging() {
        return (dragRing !== null && dragRing !== undefined);
    }

    function cancelDrag(tween) {
        if (dragRing) {
            var kill = function() {
                if (dragRing) {
                    dragRing.destroy();
                }
                dragRing = null;
            };
            if (tween) {
                dragRing.transitionOut(true, kill);
            } else {
                kill();
            }
        }
    }

    function createDrag(c, t) {
        dragRing = new ring.Ring(c);
        dragRing.ring = d3.select('#wffield').append('div').html('&nbsp;')
            .classed('ring', true)
            .classed('ringsolved', false)
        ;
        dragRing.resize(t);
        if (t) {
            dragRing.transitionIn(true, null);
        }
        return dragRing;
    }

    function continueDrag(table, newx, newy, transitt, transitcb) {
        // find angle from drag start to mouse
        var anchor = dragRing.getAnchor();
        var dy = newy - anchor.y;
        var dx = newx - anchor.x;
        var saa = util.snapAngle(dx, dy);
        var direction = saa[1];

        // Don't just cast a ray to find the end cell -- for diagonals, we'll
        // hit cells that are overlapping but off-line. Instead, walk along the
        // grid in the given direction until you've covered the distance.
        var dist2 = (dx*dx) + (dy*dy);
        var row = dragRing.startCell.row;
        var col = dragRing.startCell.column;
        // ummm, these are xy instead of rc
        var delta = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]][direction];
        var cell, fdist2;
        do {
            cell = table.getCell(row, col);
            var fp = cell.getPagePosition();
            var sp = dragRing.startCell.getPagePosition();
            var fdx = fp.x - sp.x + (dragRing.size*delta[0]);
            var fdy = fp.y - sp.y + (dragRing.size*delta[1]);
            fdist2 = (fdx*fdx) + (fdy*fdy);
            row += delta[1];
            col += delta[0];
        } while (fdist2<dist2 && row>=0 && row<table.size && col>=0 && col<table.size);

        if (cell && cell !== dragRing.endCell) {
            dragRing.endCell = cell;
            dragRing.word = table.wordBetweenCells(dragRing.startCell, dragRing.endCell);
            dragRing.resize(transitt, transitcb);
        }
    }

    function finishDrag(tween) {
        if (dragRing.word.length < 2) {
            cancelDrag(tween);
            return null;
        }
        dragRing.ring.style('z-index', '-1');
        var rv = dragRing;
        dragRing = null;
        return rv;
    }

    module.exports = {
        dragging: dragging,
        createDrag: createDrag,
        continueDrag: continueDrag,
        finishDrag: finishDrag,
        cancelDrag: cancelDrag
    };
}());
