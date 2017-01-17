(function() {
    'use strict';

    var d3 = require('d3');
    var util = require('../util');
    var colors = require('./colors');

    function Ring(cell) {
        this.ring = null;
        this.startCell = cell;
        this.endCell = null;
        this.word = '';
        this.answer = null;
        this.calculateMetrics();
    }

    Ring.prototype.calculateMetrics = function() {
        // NOTE: displayPuzzle() sets some properties as defaults on my prototype based on inferred CSS.
        //this.borderSize = Ring.prototype.borderSize;
        //this.size = this.startCell.size * 2 / 3;
    };

    Ring.prototype.getAnchor = function() {
        var sp = this.startCell.getPagePosition();
        var cx = (sp.x + (this.startCell.size / 2));
        var cy = (sp.y + (this.startCell.size / 2));
        return {x: cx, y: cy};
    };

    Ring.prototype.getCellOffset = function() {
        return ((this.startCell.size - this.size) / 2) - this.borderSize;
    };

    Ring.prototype.calcWidth = function() {
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
        var dist = Math.sqrt((dx*dx) + (dy*dy));
        return dist + this.size;
    };

    Ring.prototype.resize = function(tween, transitcb) {
        tween = util.calcTweenTime(tween);

        // position the ring.
        if (this.startCell) {
            var pp = d3.select('#playField').node().getBoundingClientRect();
            var sp = this.startCell.getPagePosition();
            var y = sp.y - pp.top + this.getCellOffset();
            var x = sp.x - pp.left + this.getCellOffset();
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
                    .duration(tween)
                    .ease(d3.easeSinOut)
                    .style('width', wid + 'px')
                    .style('transform', 'rotate(' + rot + 'deg)')
                    .on('end', transitcb)
                ;

            } else {
                // snap back to a single cell.
                this.ring.transition('ringresize')
                    .duration(tween)
                    .ease(d3.easeSinOut)
                    .style('width', this.size + 'px')
                    .style('transform', null)
                    .on('end', transitcb)
                ;
            }
        }
    };

    Ring.prototype.transitionIn = function(tween, cb) {
        tween = util.calcTweenTime(tween);
        var pp = d3.select('#playField').node().getBoundingClientRect();

        var y = parseInt(this.ring.style('top'), 10);
        var x = parseInt(this.ring.style('left'), 10);
        var w = parseInt(this.ring.style('width'), 10);
        var h = parseInt(this.ring.style('height'), 10);
        var anchor = this.getAnchor();
        this.ring
            .style('top', (anchor.y-pp.top) + 'px')
            .style('left', (anchor.x-pp.left) + 'px')
            .style('width', '1px')
            .style('height', '1px');
        this.ring.transition('ringlife')
            .duration(tween)
            .ease(d3.easeSinOut)
            .style('top', y + 'px')
            .style('left', x + 'px')
            .style('width', w + 'px')
            .style('height', h + 'px')
            .on('end', function() {
                if (cb) {
                    return cb();
                }
                return null;
            })
        ;
    };

    Ring.prototype.transitionOut = function(tween, cb) {
        tween = util.calcTweenTime(tween);
        var pp = d3.select('#playField').node().getBoundingClientRect();
        var anchor = this.getAnchor();

        this.ring.transition('ringlife')
            .duration(tween)
            .ease(d3.easeSinIn)
            .style('top', (anchor.y-pp.top) + 'px')
            .style('left', (anchor.x-pp.left) + 'px')
            .style('width', '1px')
            .style('height', '1px')
            .on('end', function() {
                if (cb) {
                    return cb();
                }
                return null;
            })
        ;
    };

    Ring.prototype.destroy = function(tween) {
        tween = util.calcTweenTime(tween);
        this.startCell = null;
        this.endCell = null;
        this.answer = null;
        if (this.ring) {
            var r = this.ring;
            this.ring.transition('ringdie')
                .duration(tween)
                .style('width', '1px')
                .on('end', function() {
                    if (r) {
                        r.remove();
                    }
                })
            ;
            this.ring = null;
        }
    };

    Ring.prototype.mark = function(answer, tween, t) {
        this.answer = (t)?answer:null;
        if (t && this.answer) {
            this.ring.attr('id', 'ring_'+answer.word);
        }
        if (this.ring.classed('ringsolved') === t) {
            return;
        }
        tween = util.calcTweenTime(tween);
        var bgc = this.bgColor;
        var boc = this.borderColor;
        if (t) {
            bgc = this.solvedColor;
            boc = this.solvedColor;
        }

        this.ring.classed('ringsolved', t);
        this.ring.transition('ringmark')
            .duration(tween)
            .ease(d3.easeSinIn)
            .style('background-color', bgc)
            .style('border-color', boc)
        ;
    };

    Ring.prototype.doVictory = function(i, tweent) {
        var r = this.ring;
        r.transition('victory')
            .duration(tweent)
            .delay((tweent * 2.5) * i)
            .style('background-color', colors.ring)
            .style('border-color', colors.ring)
            .on('start', function() {
                d3.select(this).style('z-index', -1);
            })
            .transition('victory')
            .duration(tweent)
            .style('background-color', colors.bodyText)
            .style('border-color', colors.bodyText)
            .on('end', function() {
                d3.select(this).style('z-index', -2);
            })
        ;
    };

    module.exports = {
        Ring: Ring
    };
}());
