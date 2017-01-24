(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');
    var viewutil = require('./viewutil');

    var theToolbar;

    // ==================================================================

    function getGridSize() {
        var rv = consts.DEFAULT_GRID_SIZE;
        var d = d3.select('#tbSize');
        if (!d.empty()) {
            rv = parseInt(d.property('value'), 10);
        }
        return rv;
    }
    function writeGridSize(v) {
        d3.select('#tbSize').property('value', v);
    }

    function getDensity() {
        var rv = consts.DEFAULT_DENSITY;
        var d = d3.select('#tbDensity');
        if (!d.empty()) {
            rv = parseFloat(d.property('value'));
        }
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

    function onShowAdv() {
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
    }

    // ==================================================================

    function wipe() {
        d3.select('#toolbar').html('');
    }

    function mkoptionrow(par, inpid, labid, name, title, rmin, rmax, vmin, vmax, vstep, vdef) {
        var row = par.append('div').classed('row', true);
        row.append('label')
            .classed('advlbl', true)
            .attr('id', labid)
            .attr('for', inpid)
            .attr('title', title)
            .text(name);
        row.append('span')
            .classed('advrange', true)
            .classed('right', true)
            .text(rmin);
        row.append('input')
            .classed('advinp', true)
            .attr('type', 'range')
            .attr('id', inpid)
            .attr('title', title)
            .attr('min', vmin)
            .attr('max', vmax)
            .attr('step', vstep)
            .attr('value', vdef);
        row.append('span')
            .classed('advrange', true)
            .classed('left', true)
            .text(rmax);
        return row;
    }

    function init(callbacks) {
        theToolbar = d3.select('#toolbar');

        viewutil.makeToolbarButton(theToolbar, callbacks.onUndo    , 'tbUndo'    , 'backward'        , 'Erase your last ring');
        viewutil.makeToolbarButton(theToolbar, callbacks.onReset   , 'tbReset'   , 'fast-backward'   , 'Erase all rings');
        viewutil.makeToolbarButton(theToolbar, callbacks.onHint    , 'tbHint'    , 'lightbulb-o'     , 'Get a hint');

        if (consts.CHEAT) {
            viewutil.makeToolbarButton(theToolbar, callbacks.onSolve, 'tbSolve', 'birthday-cake', 'Cheat, you cheater');
        }

        viewutil.makeToolbarButton(theToolbar, callbacks.onShuffle , 'tbShuffle' , 'random'          , 'Make a new grid with the same words');
        viewutil.makeToolbarButton(theToolbar, callbacks.onNew     , 'tbNew'     , 'eject'           , 'Make a new puzzle from scratch');
        viewutil.makeToolbarButton(theToolbar, onShowAdv           , 'tbShowAdv' , 'sliders'         , 'See more options for new puzzles');
        viewutil.makeToolbarSeparator(theToolbar);
        viewutil.makeToolbarButton(theToolbar, callbacks.onHelp    , 'tbHelp'    , 'question-circle' , 'About WORDFINDATRON');
        viewutil.makeToolbarButton(theToolbar, callbacks.onEdit    , 'tbEdit'    , 'edit'            , 'Make your own puzzle!').classed('button-reverse' , true);

        var tba = theToolbar.append('div').attr('id', 'tbadvanced');
        tba.append('h3').html('Options for new puzzles (<i class="fa fa-eject"></i>)');
        var tbo = tba.append('div').attr('id', 'options');
        mkoptionrow(tbo,
            'tbSize', 'labTbSize',
            'Grid Size', 'Set the size of the grid',
            'small', 'large',
            ''+consts.MIN_GRID_SIZE, ''+consts.MAX_GRID_SIZE, '2', ''+consts.DEFAULT_GRID_SIZE);
        mkoptionrow(tbo,
            'tbDensity', 'labTbDensity',
            '# Words', 'Set how full the grid gets',
            'fewer', 'more',
            ''+consts.MIN_DENSITY, ''+consts.MAX_DENSITY, '0.100', ''+consts.DEFAULT_DENSITY);

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
