(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');

    // ==================================================================

    var metrics = {};
    // derive metrics from css
    function initMetrics(puz) {
        var body = d3.select('body');
        var main = d3.select('#main');
        metrics.main = {
            width: parseFloat(main.style('width')),
            margin: parseFloat(main.style('margin-left'))
        };

        metrics.color = {
            none: 'transparent',
            bg: body.style('background-color'),
            fg: body.style('color'),
            highlight: '#999' // see below
        };
        var dummy = body.append('div').classed('warning', true);
        metrics.color.warning = dummy.style('color');
        dummy.remove();

        dummy = body.append('div').attr('id', 'metricsDummy');
        metrics.cell = {
            size: parseFloat(dummy.style('width')),
            fontSize: parseFloat(dummy.style('font-size'))
        };
        metrics.table = {
            size: Math.min(metrics.cell.size*puz.size, 720, metrics.main.width)
        };
        // round off now to make sure table layout doesn't fudge cell sizes
        metrics.cell.size = Math.floor(metrics.table.size / puz.size);
        metrics.cell.contentOffset = metrics.cell.size * 0.24;
        metrics.table.size = metrics.cell.size * puz.size;
        metrics.cell.fontSize = metrics.cell.size / 2;
        dummy.remove();

        dummy = body.append('div').classed('ring', true);
        metrics.color.highlight = dummy.style('border-color');
        var rs = metrics.cell.size * 2 / 3;
        var bs = parseFloat(dummy.style('border-top-width'));
        metrics.ring = {
            size: rs,
            borderSize: bs,
            pivot: (rs / 2) + bs
        };
        dummy.remove();

        dummy = d3.select('#wflist').append('div').classed('wfword', true);
        metrics.wordlist = {
            width: parseFloat(dummy.style('max-width')),
            fontSize: parseFloat(dummy.style('font-size'))
        };
        dummy.remove();

        dummy = body.append('button');
        metrics.toolbar = {
            fontSize: parseFloat(dummy.style('font-size'))
        };
        dummy.remove();
    }

    // ==================================================================


    function makeToolbarButton(par, cb, id, ic, ti) {
        var b = par.append('button')
            .attr('id', id)
            .attr('type', 'button')
            .attr('title', ti)
        ;
        if (cb) {
            b.on('click', cb);
        }
        b.append('i')
            .classed('fa', true)
            .classed('fa-'+ic, true)
            .classed('fa-fw', true)
        ;
        return b;
    }

    function makeToolbarSeparator(par, id) {
        var rv = par.append('span').classed('tbseparator', true);
        if (id) {
            rv.attr('id', id);
        }
        return rv;
    }


    // if t is undefined, return TWEEN_TIME.
    // if it's true or false, return either 0 or TWEEN_TIME.
    // otherwise, assume it's a number overriding the default time value, and return it unchanged.
    function tweenTime(t) {
        if (typeof t === 'undefined' || t === true) {
            t = consts.TWEEN_TIME;
        } else if (!t) {
            t = 0;
        }
        return t;
    }

    function fadeTime(t) {
        if (typeof t === 'undefined' || t === true) {
            t = consts.FADE_TIME;
        } else if (!t) {
            t = 0;
        }
        return t;
    }

    // ==================================================================

    module.exports = {
        makeToolbarButton: makeToolbarButton,
        makeToolbarSeparator: makeToolbarSeparator,
        tweenTime: tweenTime,
        fadeTime: fadeTime,
        initMetrics: initMetrics,
        metrics: metrics
    };
}());
