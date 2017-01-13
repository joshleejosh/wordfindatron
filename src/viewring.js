(function () {
'use strict';

var d3 = require('d3');
var consts = require('./consts');
var util = require('./util');

function Ring(cell) {
    this.ring = null;
    this.startCell = cell;
    this.endCell = null;
    this.word = '';

    this.calculateMetrics = function() {
        // displayPuzzle() sets some properties as defaults on my prototype.
        //this.borderSize = Ring.prototype.borderSize;
        //this.size = this.startCell.size * 2 / 3;
        var sp = this.startCell.getPagePosition();
        this.cx = (sp.x + this.startCell.size/2);
        this.cy = (sp.y + this.startCell.size/2);
        this.cellOffset = (this.startCell.size - this.size) / 2;
    };
    this.calculateMetrics();

    this.destroy = function() {
        if (this.ring) {
            this.ring.remove();
        }
        this.startCell = null;
        this.endCell = null;
    };

    this.calcWidth = function() {
        if (!this.startCell || !this.endCell) {
            return this.size;
        }
        var sp = this.startCell.getPagePosition();
        var ep = this.endCell.getPagePosition();
        var dx = ep.x - sp.x;
        var dy = ep.y - sp.y;
        if (dx === 0 && dy === 0) {
            return this.size;
        }
        var dist = Math.sqrt(dx*dx + dy*dy);
        return dist + this.size;
    };

    this.resize = function(transit, transitcb) {
        if (util.isMobile() || transit === false) {
            transit = 0;
        } else if (transit === true) {
            transit = consts.TRANSITION_TIME;
        }

        // position the ring.
        if (this.startCell) {
            var pp = d3.select('#wffield').node().getBoundingClientRect();
            var sp = this.startCell.getPagePosition();
            var y = sp.y - pp.top + this.cellOffset - this.borderSize;
            var x = sp.x - pp.left + this.cellOffset - this.borderSize;
            this.ring.style('top', '' + y + 'px')
                     .style('left', '' + x + 'px')
            ;

            // scale, translate, and rotate the ring.
            if (this.endCell) {
                var wid = this.calcWidth();
                var ep = this.endCell.getPagePosition();
                var a = util.snapAngle(ep.x - sp.x, ep.y - sp.y);
                var rot = a[0] * (360.0/Math.TAU);
                this.ring.transition('ringresize')
                    .duration(transit)
                    .ease(d3.easeSinOut)
                    .style('width', wid + 'px')
                    .style('transform', 'rotate(' + rot + 'deg)')
                    .on('end', transitcb)
                ;

            } else {
                // snap back to a single cell.
                this.ring.transition('ringresize')
                    .duration(transit)
                    .ease(d3.easeSinOut)
                    .style('width', this.size + 'px')
                    .style('transform', null)
                    .on('end', transitcb)
                ;
            }
        }
    };

    this.transitionIn = function(transit, cb) {
        if (util.isMobile() || transit === false) {
            transit = 0;
        } else if (transit === true) {
            transit = consts.TRANSITION_TIME / 2;
        }
        var pp = d3.select('#wffield').node().getBoundingClientRect();

        var y = parseInt(this.ring.style('top'), 10);
        var x = parseInt(this.ring.style('left'), 10);
        var w = parseInt(this.ring.style('width'), 10);
        var h = parseInt(this.ring.style('height'), 10);
        this.ring
            .style('top', (this.cy-pp.top) + 'px')
            .style('left', (this.cx-pp.left) + 'px')
            .style('width', '1px')
            .style('height', '1px');
        this.ring.transition('ringlife')
            .duration(transit)
            .ease(d3.easeSinOut)
            .style('top', y + 'px')
            .style('left', x + 'px')
            .style('width', w + 'px')
            .style('height', h + 'px')
            .on('end', function() {
                if (cb) {
                    cb();
                }
            })
        ;
    };

    this.transitionOut = function(transit, cb) {
        if (util.isMobile() || transit === false) {
            transit = 0;
        } else if (transit === true) {
            transit = consts.TRANSITION_TIME;
        }
        var pp = d3.select('#wffield').node().getBoundingClientRect();

        this.ring.transition('ringlife')
            .duration(transit)
            .ease(d3.easeSinIn)
            .style('top', (this.cy-pp.top) + 'px')
            .style('left', (this.cx-pp.left) + 'px')
            .style('width', '1px')
            .style('height', '1px')
            .on('end', function() {
                if (cb) {
                    cb();
                }
            })
        ;
    };

}

module.exports = {
    Ring:Ring
};

}());
