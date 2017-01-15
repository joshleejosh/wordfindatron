(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');
    var util = require('../util');
    var colors = require('./colors');

    function ListWord(gridWord) {
        this.answer = gridWord;
        this.word = this.answer.word;
    }

    ListWord.prototype.mark = function(m, tweent) {
        if (typeof tweent === 'undefined') {
            tweent = consts.FADE_TIME;
        }
        if (!this.selection) {
            this.selection = d3.select('#wflist_'+this.word);
        }
        if (!this.selection.empty() && this.selection.classed('wfsolved')!==m) {
            var tt = util.calcTweenTime(tweent);
            var bgc = colors.bodyBg,
                txc = colors.bodyText;
            if (m) {
                bgc = colors.bodyText;
                txc = colors.bodyBg;
            }
            this.selection.classed('wfsolved', m);
            this.selection.transition('wordmark')
                .duration(tt)
                .ease(d3.easeSinIn)
                .style('background-color', bgc)
                .style('color', txc)
            ;
        }
    };

    ListWord.prototype.doVictory = function(i, tweent) {
        if (!this.selection) {
            this.selection = d3.select('#wflist_'+this.word);
        }
        var s = this.selection;
        s.transition()
            .duration(tweent)
            .delay((tweent * 2.5) * i)
            .style('background-color', colors.ring)
            .on('end', function() {
                s.transition()
                    .duration(tweent)
                    .style('background-color', colors.bodyText)
                ;
            })
        ;
    };

    module.exports = {
        ListWord: ListWord
    };
}());
