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

    function setHintable(t) {
        d3.select('#tbHint').attr('disabled', (t)?null:true);
        d3.select('#tbSolve').attr('disabled', (t)?null:true);
    }

    function onShowAdv() {
        var a = theToolbar.select('#tbadvanced');
        var b = (a.style('display') === 'none') ? 'block' : 'none';

        if (b === 'none') {
            a.transition('#tbadvanced')
                .duration(consts.FADE_TIME)
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
                .duration(consts.FADE_TIME)
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

    function buildToolbar() {
        viewutil.makeToolbarButton(theToolbar, null, 'tbUndo', 'backward', 'Erase your last ring');
        viewutil.makeToolbarButton(theToolbar, null, 'tbReset', 'fast-backward', 'Erase all rings');
        viewutil.makeToolbarButton(theToolbar, null, 'tbHint', 'lightbulb-o', 'Get a hint');

        if (consts.CHEAT) {
            viewutil.makeToolbarButton(theToolbar, null, 'tbSolve', 'birthday-cake', 'Cheat, you cheater');
        }

        viewutil.makeToolbarButton(theToolbar, null, 'tbShuffle', 'random', 'Make a new grid with the same words');
        viewutil.makeToolbarButton(theToolbar, null, 'tbNew', 'eject', 'Make a new puzzle from scratch');
        viewutil.makeToolbarButton(theToolbar, null, 'tbShowAdv', 'sliders', 'See more options for new puzzles');
        viewutil.makeToolbarSeparator(theToolbar, 'tbSep');
        viewutil.makeToolbarButton(theToolbar, null, 'tbHelp', 'question-circle', 'About WORDFINDATRON');
        viewutil.makeToolbarButton(theToolbar, null, 'tbEdit', 'edit', 'Make your own puzzle!').classed('button-reverse', true);

        var tba = theToolbar.append('div').attr('id', 'tbadvanced');
        tba.append('h3').html('Options for new puzzles (<i class="fa fa-eject"></i>)');
        var opts = tba.append('div').attr('id', 'options');
        mkoptionrow(opts,
            'tbSize', 'labTbSize',
            'Size', 'Set the size of the grid',
            'small', 'large',
            ''+consts.MIN_GRID_SIZE, ''+consts.MAX_GRID_SIZE, '2', ''+consts.DEFAULT_GRID_SIZE);
        mkoptionrow(opts,
            'tbDensity', 'labTbDensity',
            'Words', 'Set how full the grid gets',
            'fewer', 'more',
            ''+consts.MIN_DENSITY, ''+consts.MAX_DENSITY, '0.100', ''+consts.DEFAULT_DENSITY);
    }

    function rebind(callbacks) {
        theToolbar.select('#tbUndo').on('click', callbacks.onUndo);
        theToolbar.select('#tbReset').on('click', callbacks.onReset);
        theToolbar.select('#tbHint').on('click', callbacks.onHint);
        theToolbar.select('#tbSolve').on('click', callbacks.onSolve);
        theToolbar.select('#tbShuffle').on('click', callbacks.onShuffle);
        theToolbar.select('#tbNew').on('click', callbacks.onNew);
        theToolbar.select('#tbShowAdv').on('click', onShowAdv);
        theToolbar.select('#tbHelp').on('click', callbacks.onHelp);
        theToolbar.select('#tbEdit').on('click', callbacks.onEdit);
    }

    function init(callbacks) {
        theToolbar = d3.select('#toolbar');
        if (theToolbar.node().children.length === 0) {
            buildToolbar();
        }
        rebind(callbacks);

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

    function reparent(child, newParent, newSibling) {
        if (!child.empty() && child.node().parentNode !== newParent.node()) {
            newParent.node().insertBefore(child.node(), newSibling.node());
        }
    }

    // if we've wrapped lines, then move some buttons down into the advanced menu.
    function reparentButtons(t) {
        var bEdit = theToolbar.select('#tbEdit');
        var bNew = theToolbar.select('#tbNew');
        var bShuffle = theToolbar.select('#tbShuffle');
        var bCheat = theToolbar.select('#tbSolve');
        var sep = theToolbar.select('#tbSep');

        if (t) {
            // move some buttons into the advanced submenu to save width.
            var tbAdvanced = theToolbar.select('#tbadvanced');
            reparent(bEdit, tbAdvanced, tbAdvanced.select('h3'));
            reparent(sep, tbAdvanced, bEdit);
            reparent(bNew, tbAdvanced, sep);
            reparent(bShuffle, tbAdvanced, bNew);
            reparent(bCheat, tbAdvanced, bShuffle);
        } else {
            // move buttons up onto the main toolbar.
            reparent(bEdit, theToolbar, theToolbar.select('#tbadvanced'));
            reparent(sep, theToolbar, theToolbar.select('#tbHelp'));
            reparent(bNew, theToolbar, theToolbar.select('#tbShowAdv'));
            reparent(bShuffle, theToolbar, bNew);
            reparent(bCheat, theToolbar, bShuffle);
        }
    }

    function resize() {
        reparentButtons(false);
        var bb0 = theToolbar.select('#tbUndo').node().getBoundingClientRect();
        var bb1 = theToolbar.select('#tbEdit').node().getBoundingClientRect();
        reparentButtons(bb1.top > bb0.top);

        theToolbar.select('#options').style('width', viewutil.metrics.table.size + 'px');
    }

    // ==================================================================

    module.exports = {
        wipe: wipe,
        init: init,
        hide: hide,
        show: show,
        resize: resize,
        enable: enable,
        disable: disable,
        setUndoable: setUndoable,
        setHintable: setHintable,
        getGridSize: getGridSize,
        getDensity: getDensity,
        getSeed: getSeed,
        writeGridSize: writeGridSize,
        writeDensity: writeDensity,
        writeSeed: writeSeed
    };
}());
