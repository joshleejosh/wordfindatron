(function() {
    'use strict';

    var d3 = require('d3');
    var util = require('../util');
    var viewutil = require('./viewutil');
    var metrics = viewutil.metrics;

    function Ring(cell, sel) {
        this.selection = sel;
        this.startCell = cell;
        this.endCell = null;
        this.word = '';
        this.answer = null;
    }

    Ring.prototype.setID = function() {
        this.id = 'r';
        if (this.startCell) {
            this.id += this.startCell.y + '.' + this.startCell.x;
        }
        this.id += '_'
        if (this.endCell) {
            this.id += this.endCell.y + '.' + this.endCell.x;
        }
        this.selection.attr('id', this.id);
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
            this.selection.style('top', '' + y + 'px')
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
                this.selection.transition('ring.resize')
                    .duration(tween)
                    .ease(d3.easeSinOut)
                    .style('width', wid + 'px')
                    .style('transform', 'rotate(' + rot + 'deg)')
                    .on('end', transitcb)
                ;
            } else {
                // snap back to a single cell.
                this.selection.transition('ring.resize')
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

        var y = parseFloat(this.selection.style('top'));
        var x = parseFloat(this.selection.style('left'));
        var anchor = this.getAnchor();
        this.selection
            .style('top', (anchor.y-pp.top) + 'px')
            .style('left', (anchor.x-pp.left) + 'px')
            .style('width', '1px')
            .style('height', '1px');
        this.selection.transition('ring.transition')
            .duration(tween)
            .ease(d3.easeSinOut)
            .style('top', y + 'px')
            .style('left', x + 'px')
            .style('width', metrics.ring.size + 'px')
            .style('height', metrics.ring.size + 'px')
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

        this.selection.transition('ring.transition')
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
        if (this.selection) {
            var r = this.selection;
            this.selection.transition('ring.destroy')
                .duration(tween)
                .style('width', '1px')
                .on('end', function() {
                    if (r) {
                        r.remove();
                    }
                })
            ;
            this.selection = null;
        }
    };

    Ring.prototype.mark = function(answer, tween, t) {
        this.answer = (t)?answer:null;
        if (this.selection.classed('ringsolved') === t) {
            return;
        }
        tween = viewutil.tweenTime(tween);
        var bgc = metrics.color.none;
        var boc = metrics.color.disabled;
        if (t) {
            bgc = metrics.color.lowlight;
            boc = metrics.color.lowlight;
        }

        this.selection.classed('ringsolved', t)
            .transition('ring.mark')
                .duration(tween)
                .ease(d3.easeSinIn)
                .style('background-color', bgc)
                .style('border-color', boc)
        ;
    };

    Ring.prototype.doVictory = function(i, tweent, onStart, onEnd) {
        var that = this;
        this.selection.transition('ring.victory')
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
            .style('background-color', metrics.color.lowlight)
            .style('border-color', metrics.color.lowlight)
            .on('end', function() {
                d3.select(this).style('z-index', -2);
                if (onEnd) {
                    return onEnd(that);
                }
                return null;
            })
        ;
    };

    Ring.prototype.fadeUnsolved = function(i, fadet, onStart, onEnd) {
        fadet = viewutil.fadeTime(fadet);
        this.selection.transition('ring.victory')
            .duration(fadet)
            .delay(i * fadet)
            .ease(d3.easeSinOut)
            .style('border-color', 'transparent')
        ;
    };

    module.exports = {
        Ring: Ring
    };
}());
