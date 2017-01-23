(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');

    var theToolbar;

    // ==================================================================

    function getGridSize() {
        var d = d3.select('#tbSize');
        var rv = parseInt(d.property('value'), 10);
        return rv;
    }
    function writeGridSize(v) {
        d3.select('#tbSize').property('value', v);
    }

    function getDensity() {
        var d = d3.select('#tbDensity');
        var rv = parseFloat(d.property('value'));
        return rv;
    }
    function writeDensity(v) {
        d3.select('#tbDensity').property('value', v);
    }

    function getSeed() {
        var rv = 0;
        var d = d3.select('#tbSeed');
        if (!d.empty()) {
            rv = parseInt(d.property('value'), 10);
        }
        return rv;
    }
    function writeSeed(v) {
        d3.select('#tbSeed').property('value', v);
    }

    function enable() {
        d3.selectAll('#toolbar button').attr('disabled', null);
        d3.selectAll('#toolbar input').attr('disabled', null);
    }
    function disable() {
        d3.selectAll('#toolbar button').attr('disabled', true);
        d3.selectAll('#toolbar input').attr('disabled', true);
    }

    function setUndoable(t) {
        d3.select('#tbUndo').attr('disabled', (t)?null:true);
        d3.select('#tbReset').attr('disabled', (t)?null:true);
    }

    // ==================================================================

    function wipe() {
        // nop
    }

    function init(callbacks) {
        theToolbar = d3.select('#toolbar');

        theToolbar.select('#tbUndo').on('click', callbacks.onUndo);
        theToolbar.select('#tbReset').on('click', callbacks.onReset);
        theToolbar.select('#tbHint').on('click', callbacks.onHint);
        theToolbar.select('#tbHelp').on('click', callbacks.onHelp);
        theToolbar.select('#tbShuffle').on('click', callbacks.onShuffle);
        theToolbar.select('#tbNew').on('click', callbacks.onNew);
        theToolbar.select('#tbEdit').on('click', callbacks.onEdit);

        theToolbar.select('#tbShowAdv').on('click', function() {
            var a = theToolbar.select('#tbadvanced');
            var b = a.style('display');
            b = (b === 'none') ? 'block' : 'none';
            if (b === 'none') {
                a.transition('#tbadvanced')
                    .duration(consts.TWEEN_TIME)
                    .ease(d3.easeSinOut)
                    .style('height', '0px')
                    .on('end', function() {
                        d3.select(this).style('display', b).style('height', null);
                    })
                ;
                d3.select('#tbShowAdv').classed('button-reverse', false);
            } else {
                a
                    .style('display', b)
                    .style('height', '0px')
                    .transition('#tbadvanced')
                        .duration(consts.TWEEN_TIME)
                        .ease(d3.easeSinIn)
                        .style('height', null)
                ;
                d3.select('#tbShowAdv').classed('button-reverse', true);
            }
        });

        if (consts.CHEAT && d3.select('#tbSolve').empty()) {
            theToolbar.insert('button', '#tbShuffle')
                .attr('id', 'tbSolve')
                .attr('type', 'button')
                .html('<i class="fa fa-birthday-cake fa-fw"></i>')
                .on('click', callbacks.onSolve)
            ;
            theToolbar.insert('span', '#tbShuffle').text(' ');
        }

        theToolbar.on('submit', function() {
            d3.event.preventDefault();
        });
    }

    function hide(cb) {
        theToolbar
                .style('height', null)
            .transition('toolbar')
                .duration(consts.FADE_TIME)
                .ease(d3.easeSinOut)
                .style('height', '0px')
            .on('end', function() {
                d3.select(this).style('display', 'none').style('height', null);
                if (cb) {
                    return cb();
                }
                return null;
            })
        ;
    }

    function show(cb) {
        theToolbar
                .style('height', '0px')
                .style('display', 'block')
            .transition('toolbar')
                .duration(consts.FADE_TIME)
                .ease(d3.easeSinIn)
                .style('height', null)
            .on('end', function() {
                if (cb) {
                    return cb();
                }
                return null;
            })
        ;
    }

    // ==================================================================

    module.exports = {
        wipe: wipe,
        init: init,
        hide: hide,
        show: show,
        enable: enable,
        disable: disable,
        setUndoable: setUndoable,
        getGridSize: getGridSize,
        getDensity: getDensity,
        getSeed: getSeed,
        writeGridSize: writeGridSize,
        writeDensity: writeDensity,
        writeSeed: writeSeed
    };
}());
