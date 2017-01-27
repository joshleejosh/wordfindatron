(function() {
    'use strict';

    var d3 = require('d3');
    var util = require('../util');
    var viewutil = require('./viewutil');
    var metrics = viewutil.metrics;

    function Ring(cell) {
        this.ring = null;
        this.startCell = cell;
        this.endCell = null;
        this.word = '';
        this.answer = null;
    }

    Ring.prototype.getAnchor = function() {
        var sp = this.startCell.getPagePosition();
        var cx = (sp.x + (metrics.cell.size / 2));
        var cy = (sp.y + (metrics.cell.size / 2));
        return {x: cx, y: cy};
    };

    Ring.prototype.calcWidth = function() {
        if (!this.startCell || !this.endCell) {
            return metrics.ring.size;
        }
        var sp = this.startCell.getPagePosition();
        var ep = this.endCell.getPagePosition();
        var dx = ep.x - sp.x;
        var dy = ep.y - sp.y;
        if (dx === 0 && dy === 0) {
            return metrics.ring.size;
        }
        var dist = Math.sqrt((dx*dx) + (dy*dy));
        return dist + metrics.ring.size;
    };

    Ring.prototype.resize = function(tween, transitcb) {
        tween = viewutil.tweenTime(tween);
        var cellOffset = ((metrics.cell.size - metrics.ring.size) / 2) - metrics.ring.borderSize;

        // position the ring.
        if (this.startCell) {
            var pp = d3.select('#playField').node().getBoundingClientRect();
            var sp = this.startCell.getPagePosition();
            var y = sp.y - pp.top + cellOffset;
            var x = sp.x - pp.left + cellOffset;
            var h = metrics.ring.size;
            this.ring.style('top', '' + y + 'px')
                .style('left', '' + x + 'px')
                .style('height', '' + h + 'px')
                .style('transform-origin', '' + metrics.ring.pivot + 'px ' + metrics.ring.pivot + 'px')
            ;

            // scale, translate, and rotate the ring.
            if (this.endCell) {
                var wid = this.calcWidth();
                var ep = this.endCell.getPagePosition();
                var a = util.snapAngle(ep.x - sp.x, ep.y - sp.y);
                var rot = a[0] * (360.0 / Math.TAU);
                this.ring.transition('ring.resize')
                    .duration(tween)
                    .ease(d3.easeSinOut)
                    .style('width', wid + 'px')
                    .style('transform', 'rotate(' + rot + 'deg)')
                    .on('end', transitcb)
                ;
            } else {
                // snap back to a single cell.
                this.ring.transition('ring.resize')
                    .duration(tween)
                    .ease(d3.easeSinOut)
                    .style('width', metrics.ring.size + 'px')
                    .style('transform', null)
                    .on('end', transitcb)
                ;
            }
        }
    };

    Ring.prototype.transitionIn = function(tween, cb) {
        tween = viewutil.tweenTime(tween);
        var pp = d3.select('#playField').node().getBoundingClientRect();

        var y = parseFloat(this.ring.style('top'));
        var x = parseFloat(this.ring.style('left'));
        var w = parseFloat(this.ring.style('width'));
        var h = parseFloat(this.ring.style('height'));
        var anchor = this.getAnchor();
        this.ring
            .style('top', (anchor.y-pp.top) + 'px')
            .style('left', (anchor.x-pp.left) + 'px')
            .style('width', '1px')
            .style('height', '1px');
        this.ring.transition('ring.transition')
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
        tween = viewutil.tweenTime(tween);
        var pp = d3.select('#playField').node().getBoundingClientRect();
        var anchor = this.getAnchor();

        this.ring.transition('ring.transition')
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
        tween = viewutil.tweenTime(tween);
        this.startCell = null;
        this.endCell = null;
        this.answer = null;
        if (this.ring) {
            var r = this.ring;
            this.ring.transition('ring.destroy')
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
        tween = viewutil.tweenTime(tween);
        var bgc = metrics.color.none;
        var boc = metrics.color.highlight;
        if (t) {
            bgc = metrics.color.fg;
            boc = metrics.color.fg;
        }

        this.ring.classed('ringsolved', t);
        this.ring.transition('ring.mark')
            .duration(tween)
            .ease(d3.easeSinIn)
            .style('background-color', bgc)
            .style('border-color', boc)
        ;
    };

    Ring.prototype.doVictory = function(i, tweent, onStart, onEnd) {
        var that = this;
        this.ring.transition('ring.victory')
            .duration(tweent)
            .delay((tweent * 2.5) * i)
            .style('background-color', metrics.color.highlight)
            .style('border-color', metrics.color.highlight)
            .on('start', function() {
                d3.select(this).style('z-index', -1);
                if (onStart) {
                    return onStart(that);
                }
                return null;
            })
         .transition('ring.victory')
            .duration(tweent)
            .style('background-color', metrics.color.fg)
            .style('border-color', metrics.color.fg)
            .on('end', function() {
                d3.select(this).style('z-index', -2);
                if (onEnd) {
                    return onEnd(that);
                }
                return null;
            })
        ;
    };

    module.exports = {
        Ring: Ring
    };
}());
