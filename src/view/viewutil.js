(function() {
    'use strict';

    var consts = require('../consts');

    // ==================================================================


    function makeToolbarButton(par, cb, id, ic, ti) {
        var b = par.append('button')
            .attr('id', id)
            .attr('type', 'button')
            .attr('title', ti)
            .on('click', cb)
        ;
        b.append('i')
            .classed('fa', true)
            .classed('fa-'+ic, true)
            .classed('fa-fw', true)
        ;
        return b;
    }

    function makeToolbarSeparator(par) {
        return par.append('span').classed('tbseparator', true);
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
        fadeTime: fadeTime
    };
}());
