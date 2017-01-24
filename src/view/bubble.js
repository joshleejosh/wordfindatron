(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');

    function Bubble(id) {
        this.id = id;
        this.selection = d3.select('#'+this.id);
        this.hide(false);
        this.below = false;
        this.owner = null;
        var that = this;
        this.selection.on('click', function() {
            that.hide(null, true);
        });
        return this;
    }

    Bubble.prototype.isVisible = function() {
        return this.selection.style('display') !== 'none';
    };

    Bubble.prototype.show = function(caller, tweent) {
        if (tweent === true) {
            tweent = consts.TWEEN_TIME;
        }

        var rCaller = caller.node().getBoundingClientRect();
        var side = (this.below)?'top':'bottom';
        this.selection
            .style('display', 'block')
            .style('width', null)
            .style('height', null)
            .style('top', null)
            .style('right', null)
            .style('bottom', null)
            .style('left', '0')
            .style(side, '0')
        ;
        var rBubble = this.selection.node().getBoundingClientRect();
        var pad = parseInt(this.selection.style('padding-left'), 10) / 2;
        var x = Math.max(0, rCaller.left - rBubble.width - pad);
        var y = (this.below) ? rCaller.bottom + pad : rBubble.bottom - rCaller.top + pad;
        var that = this;

        this.selection
                .style('display', 'block')
                .style(side, y + 'px')
                .style('left', (x+rBubble.width) + 'px')
                .style('width', '0')
                .style('height', '0')
            .transition('bubble')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('width', null)
                .style('height', null)
                .style('left', x + 'px')
            .on('end', function() {
                if (that.owner) {
                    that.owner.classed('button-reverse', true);
                }
                d3.select('body').append('div')
                    .attr('id', 'bubbleBlocker')
                    .style('position', 'fixed')
                    .style('top', '0')
                    .style('left', '0')
                    .style('bottom', '0')
                    .style('right', '0')
                    .style('width', '100%')
                    .style('height', '100%')
                    .on('mousedown', function() {
                        that.hide(null, true);
                    });
            })
        ;

    };

    Bubble.prototype.hide = function(caller, tweent) {
        if (tweent === true) {
            tweent = consts.TWEEN_TIME;
        }
        d3.select('#bubbleBlocker').remove();
        if (this.owner) {
            this.owner.classed('button-reverse', false);
        }

        var rBubble = this.selection.node().getBoundingClientRect();
        this.selection
            .transition('bubble')
                .duration(tweent)
                .ease(d3.easeSinOut)
                .style('width', '0px')
                .style('height', '0px')
                .style('left', (rBubble.left+rBubble.width) + 'px')
            .on('end', function() {
                d3.select(this)
                    .style('width', null)
                    .style('height', null)
                    .style('display', 'none')
                ;
            })
        ;
    };

    // ==================================================================

    module.exports = {
        Bubble: Bubble
    };
}());
