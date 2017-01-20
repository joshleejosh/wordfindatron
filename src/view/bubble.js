(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');

    function Bubble(id) {
        this.id = id;
        this.selection = d3.select('#'+this.id);
        this.hide(false);
        this.below = false;
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
        ;
    };

    Bubble.prototype.hide = function(caller, tweent) {
        if (tweent === true) {
            tweent = consts.TWEEN_TIME;
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
