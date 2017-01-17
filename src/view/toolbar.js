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

    function getNumWords() {
        var d = d3.select('#tbWords');
        var rv = parseInt(d.property('value'), 10);
        return rv;
    }
    function writeNumWords(v) {
        d3.select('#tbWords').property('value', v);
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

    // ==================================================================

    function updateLabel(id, v, suffix) {
        d3.select('#'+id).html(v + ' &mdash; ' + suffix);
    }

    function wipe() {
        d3.select('#tbUndo').on('click', null);
        d3.select('#tbReset').on('click', null);
        d3.select('#tbHint').on('click', null);
        d3.select('#tbNew').on('click', null);
        d3.select('#tbEdit').on('click', null);
        d3.select('#tbShowAdv').on('click', null);
    }

    function init(callbacks) {
        theToolbar = d3.select('#toolbar');

        theToolbar.select('#tbUndo').on('click', callbacks.onUndo);
        theToolbar.select('#tbReset').on('click', callbacks.onReset);
        theToolbar.select('#tbHint').on('click', callbacks.onHint);
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
                d3.select(this).text('options');
            } else {
                a
                    .style('display', b)
                    .style('height', '0px')
                    .transition('#tbadvanced')
                        .duration(consts.TWEEN_TIME)
                        .ease(d3.easeSinIn)
                        .style('height', null)
                ;
                d3.select(this).text('(hide)');
            }
        });

        updateLabel('labTbSize', getGridSize(), 'Grid Size');
        theToolbar.select('#tbSize')
            .on('input', function() {
                updateLabel('labTbSize', getGridSize(), 'Grid Size');
            })
            .on('change', function() {
                updateLabel('labTbSize', getGridSize(), 'Grid Size');
            });

        updateLabel('labTbWords', getNumWords(), '# Words');
        theToolbar.select('#tbWords')
            .on('input', function() {
                updateLabel('labTbWords', getNumWords(), '# Words');
            })
            .on('change', function() {
                updateLabel('labTbWords', getNumWords(), '# Words');
            });

        if (consts.CHEAT) {
            var a = theToolbar.select('#tbadvanced');
            if (d3.select('#tbSeed').empty()) {
                a.append('input')
                    .attr('id', 'tbSeed')
                    .attr('type', 'number')
                    .property('value', 0)
                ;
            }
            if (d3.select('#labTbSeed').empty()) {
                a.append('label')
                    .attr('id', 'labTbSeed')
                    .attr('for', 'tbSeed')
                    .text('Seed #')
                ;
            }
        }

        if (consts.CHEAT && d3.select('#tbSolve').empty()) {
            theToolbar.insert('button', '#tbNew')
                .attr('id', 'tbSolve')
                .attr('type', 'button')
                .text('Solve')
                .on('click', callbacks.onSolve)
            ;
            theToolbar.insert('span', '#tbNew').text(' ');
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
        getGridSize: getGridSize,
        getNumWords: getNumWords,
        getSeed: getSeed,
        writeGridSize: writeGridSize,
        writeNumWords: writeNumWords,
        writeSeed: writeSeed
    };
}());
