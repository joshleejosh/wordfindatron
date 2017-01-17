(function() {
    'use strict';

    var d3 = require('d3');
    var snapAngle = require('../util').snapAngle;
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
        dragRing.ring = d3.select('#playField').append('div').html('&nbsp;')
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
        var dx = newx - anchor.x;
        var dy = newy - anchor.y;
        var saa = snapAngle(dx, dy);
        var direction = saa[1];

        // Don't just cast a ray to find the end cell -- for diagonals, we'll
        // hit cells that are overlapping but off-line. Instead, walk along the
        // grid in the given direction until you've covered the distance.
        var dist2 = (dx*dx) + (dy*dy);
        var x = dragRing.startCell.x;
        var y = dragRing.startCell.y;
        var delta = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]][direction];

        var cell, cellDist2;
        do {
            cell = table.getCell(x, y);
            var fp = cell.getPagePosition();
            var sp = dragRing.startCell.getPagePosition();
            var cdx = fp.x - sp.x + (dragRing.size*delta[0]);
            var cdy = fp.y - sp.y + (dragRing.size*delta[1]);
            cellDist2 = (cdx*cdx) + (cdy*cdy);
            x += delta[0];
            y += delta[1];
        } while (cellDist2<dist2 && y>=0 && y<table.size && x>=0 && x<table.size);

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
