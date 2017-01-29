(function() {
    'use strict';

    var d3 = require('d3');
    var printscout = require('printscout');
    var listword = require('./listword');
    var viewutil = require('./viewutil');

    var theWords;
    var MAX_COLUMNS = 4;
    var WORDS_PER_COLUMN = 8;
    var printing = false;

    function getListWords() {
        return theWords;
    }

    function rebind(puz) {
        theWords = [];
        for (var i=0; i<puz.answers.length; i++) {
            theWords.push(new listword.ListWord(i, puz.answers[i]));
        }

        var ul = d3.select('#wflist');
        var lis = ul.selectAll('li').data(theWords);
        lis.enter()
            .append('li')
            .attr('id', function(d) { return d.id(); })
            .classed('wfword', true)
            .classed('wfsolved', false)
        ;
        lis.exit().remove();
        ul.selectAll('li').append('span')
                .text(function(d) { return d.word; })
        ;
    }

    function resize() {
        var ul = d3.select('#wflist');
        if (ul.style('display') === 'none') {
            return;
        }

        ul.classed('columnar', false)
            .style('display', null)
            .style('column-count', null)
            .style('-moz-column-count', null)
            .style('clear', null)
            .style('width', null)
        ;
        //var bb = ul.node().getBoundingClientRect();
        var tb = d3.select('#playField').node().getBoundingClientRect();
        var tooWide = (viewutil.metrics.main.width - tb.right) < viewutil.metrics.wordlist.width;

        if (tooWide || printing) {
            var ncols = Math.min(MAX_COLUMNS, Math.ceil(theWords.length / WORDS_PER_COLUMN));
            ul.classed('columnar', true)
                .style('display', 'block')
                .style('clear', 'both')
                .style('column-count', ''+ncols)
                .style('-moz-column-count', ''+ncols)
                .style('width', tb.width + 'px')
            ;
            var r = Math.min(1, tb.width / ncols / viewutil.metrics.wordlist.width);
            var fsize = viewutil.metrics.wordlist.fontSize * r;
            ul.selectAll('.wfword')
                .style('font-size', fsize + 'px');

        } else {
            ul.classed('columnar', false)
                .style('display', null)
                .style('clear', null)
                .style('column-count', null)
                .style('-moz-column-count', null)
                .style('width', null);
            ul.selectAll('.wfword')
                .style('font-size', null);

        }
    }

    {
        // if we're printing, do a resize and force the wordlist into columns below the grid.
        /*
        window.matchMedia('print').addListener(function (ql) {
            printing = ql.matches;
            resize();
        });
        */
        var scout = new printscout();
        scout.addListener('before', function() {
            console.log('before');
            printing = true;
            resize();
        });
        scout.addListener('after', function() {
            console.log('after');
            printing = false;
            resize();
        });
    }

    function show(tweent, onEnd) {
        tweent = viewutil.fadeTime(tweent);
        d3.select('#wflist').style('display', 'inline-block');
        resize();
        d3.select('#wflist')
                .style('height', '0px')
                .style('overflow', 'hidden')
            .transition('game')
                .duration(tweent)
                .ease(d3.easeQuadIn)
                .style('height', null)
                .on('end', function () {
                    d3.select(this).style('overflow', null);
                    if (onEnd) {
                        return onEnd();
                    }
                    return null;
                })
        ;
    }

    function hide(tweent, onEnd) {
        tweent = viewutil.fadeTime(tweent);
        d3.select('#wflist')
                .style('overflow', 'hidden')
            .transition('game')
                .duration(tweent)
                .ease(d3.easeQuadOut)
                .style('height', '0px')
            .on('end', function () {
                d3.select(this)
                    .style('display', 'none')
                    .style('overflow', 'visible')
                    .style('height', null);
                if (onEnd) {
                    return onEnd();
                }
                return null;
            })
        ;
    }

    module.exports = {
        getListWords: getListWords,
        rebind: rebind,
        resize: resize,
        show: show,
        hide: hide
    };
}());
