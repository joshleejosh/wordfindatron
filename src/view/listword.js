(function() {
    'use strict';

    var d3 = require('d3');
    var viewutil = require('./viewutil');
    var colors = require('./colors');

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
            var bgc = colors.bodyBg,
                txc = colors.bodyText;
            if (m) {
                bgc = colors.bodyText;
                txc = colors.bodyBg;
            }
            this.selection.classed('wfsolved', m);
            this.selection.transition('wordmark')
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
        s.transition('victory')
            .duration(tweent)
            .delay((tweent * 2.5) * i)
            .style('background-color', colors.ring)
            .transition('victory')
            .style('background-color', colors.bodyText)
        ;
    };

    // ==================================================================

    module.exports = {
        ListWord: ListWord
    };
}());
