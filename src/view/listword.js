(function() {
    'use strict';

    var d3 = require('d3');
    var viewutil = require('./viewutil');

    function ListWord(id, gridWord) {
        this.lwid = id;
        this.answer = gridWord;
        this.word = this.answer.word;
        this.selection = null;
    }

    ListWord.prototype.id = function() {
        return 'lw_' + this.lwid;
    };

    ListWord.prototype.isSolved = function() {
        if (!this.selection) {
            this.selection = d3.select('#'+this.id());
        }
        return (!this.selection.empty() && this.selection.classed('wfsolved'));
    };

    ListWord.prototype.mark = function(m, tweent) {
        tweent = viewutil.fadeTime(tweent);
        if (!this.selection) {
            this.selection = d3.select('#'+this.id());
        }
        if (!this.selection.empty() && this.selection.classed('wfsolved')!==m) {
            var tt = viewutil.tweenTime(tweent);
            var bgc = viewutil.metrics.color.bg,
                txc = viewutil.metrics.color.fg;
            if (m) {
                bgc = viewutil.metrics.color.fg;
                txc = viewutil.metrics.color.bg;
            }
            this.selection.classed('wfsolved', m);
            this.selection.transition('listword.mark')
                .duration(tt)
                .ease(d3.easeQuadIn)
                .style('background-color', bgc)
                .style('color', txc)
            ;
        }
    };

    ListWord.prototype.doVictory = function(i, tweent) {
        if (!this.selection) {
            this.selection = d3.select('#'+this.id());
        }
        var s = this.selection;
        s.transition('listword.victory')
                .duration(tweent)
                .delay((tweent * 2.5) * i)
                .style('background-color', viewutil.metrics.color.highlight)
            .transition('listword.victory')
                .style('background-color', viewutil.metrics.color.fg)
        ;
    };

    // ==================================================================

    module.exports = {
        ListWord: ListWord
    };
}());
