(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');
    var util = require('../util');
    var viewutil = require('./viewutil');
    var editorfield = require('./editorfield');
    var bubble = require('./bubble');

    var fields;
    var onChange;
    var bubbleHelp;

    // ==================================================================

    function updateBindings() {
        var list = d3.select('#editorlist');
        var lis = list.selectAll('li').data(fields);
        lis.enter()
            .append('li')
                .classed('editoritem', true)
                .attr('id', function(ef) { return ef.id(); })
                .style('width', '' + consts.MAX_MAX_WORDLEN + 'em')
                .append('input')
                    .attr('type', 'text')
                    .attr('value', function(ef) { return ef.word; })
                    .attr('maxlength', consts.MAX_MAX_WORDLEN)
                    .style('width', '' + consts.MAX_MAX_WORDLEN + 'em')
                    .on('change', function(ef) { return ef.onInput(); })
                    .on('input', function(ef) { return ef.onInput(); })
        ;
        lis.exit().remove();
        d3.select('.editoritem').each(function (ef) {
            ef.minlen = 3;
            ef.maxlen = consts.MAX_MAX_WORDLEN;
        });
    }

    function updateButtons() {
        bubbleHelp.hide(false);
        d3.select('#editAdd').attr('disabled', (fields.length >= consts.MAX_GRID_SIZE)?true:null);
        d3.select('#editDelete').attr('disabled', (fields.length <= 1)?true:null);
        var invalid = d3.selectAll('.editoritem')
            .filter(function (ef) {
                return !ef.validate();
            });
        d3.select('#editCommit').attr('disabled', (invalid.empty())?null:true);
        if (onChange) {
            onChange();
        }
    }

    function enable() {
        d3.selectAll('#editor button').attr('disabled', null);
        d3.selectAll('#editor input').attr('disabled', null);
        updateButtons();
    }

    function disable() {
        d3.selectAll('#editor button').attr('disabled', true);
        d3.selectAll('#editor input').attr('disabled', true);
    }

    // ==================================================================

    function onAdd() {
        var f = new editorfield.Field(fields.length, '', updateButtons);
        fields.push(f);
        updateBindings();
        updateButtons();
        f.takeFocus();
    }

    function onDelete() {
        if (fields.length > 1) {
            fields.pop();
            updateBindings();
            updateButtons();
        }
    }

    function onHelp() {
        if (bubbleHelp.isVisible()) {
            bubbleHelp.hide(d3.select(this), true);
        } else {
            bubbleHelp.show(d3.select(this), true);
        }
    }

    // ==================================================================

    function wipe() {
        d3.selectAll('.editoritem').remove();
        fields = [];
        d3.select('#editTools').html('');
    }

    function setGridSize() {
        var maxlen = 0, lettersum = 0;
        for (var i=0; i<fields.length; i++) {
            var wlen = fields[i].word.length;
            lettersum += wlen;
            if (wlen > maxlen) {
                maxlen = wlen;
            }
        }

        var targetRatio = 0.500;
        var gridsize = Math.max(maxlen, Math.sqrt(lettersum / targetRatio));
        var rv = Math.floor(util.clamp(gridsize, consts.MIN_GRID_SIZE, consts.MAX_GRID_SIZE));
        //console.log(maxlen, lettersum, gridsize, rv);
        return rv;
    }

    function init(puzzle, callbacks) {
        var scratchPuzzle = puzzle.copy();
        onChange = callbacks.onChange;

        bubbleHelp = new bubble.Bubble('editHelp');
        bubbleHelp.below = true;

        var tb = d3.select('#editTools');
        viewutil.makeToolbarButton(tb, onAdd, 'editAdd', 'plus', 'Add a word to the list');
        viewutil.makeToolbarButton(tb, onDelete, 'editDelete', 'minus', 'Remove a word from the list');
        viewutil.makeToolbarButton(tb, function() {
            var sz = setGridSize();
            var wl = fields.map(function(f) {
                return f.word;
            });
            bubbleHelp.hide(false);
            callbacks.onCommit(sz, 0, wl);
        }, 'editCommit', 'check', 'Make a puzzle!');

        viewutil.makeToolbarSeparator(tb);
        viewutil.makeToolbarButton(tb, onHelp, 'editShowHelp', 'question-circle', 'About WORDEDITATRON');

        viewutil.makeToolbarButton(tb, function() {
            bubbleHelp.hide(false);
            callbacks.onQuit();
        }, 'editQuit', 'sign-out', 'Quit editing and go back to playing').classed('button-reverse', true);

        tb.on('submit', function() {
            d3.event.preventDefault();
        });

        fields = [];
        for (var i=0; i<scratchPuzzle.answers.length; i++) {
            fields.push(new editorfield.Field(i, scratchPuzzle.answers[i].word, updateButtons));
        }
        updateBindings();

        d3.select('#editorlist').style('display', 'none');
        tb.style('display', 'none');
    }

    function show(cb) {
        d3.select('h1')
            .transition('edit')
                .duration(consts.FADE_TIME * 2)
                .ease(d3.easeQuadOut)
                .style('width', '0px')
            .transition()
                .ease(d3.easeQuadIn)
                .style('width', null)
                .on('start', function() {
                    d3.select(this).text('WORDEDITATRON');
                })
        ;

        d3.select('#editorlist')
                .style('display', 'block')
                .style('width', '0px')
            .transition('edit')
                .duration(consts.FADE_TIME)
                .ease(d3.easeQuadIn)
                .style('width', null)
            .on('end', function() {
                d3.select('#editTools')
                    .style('display', 'block')
                    .style('height', '0px')
                    .transition('edit')
                    .duration(consts.FADE_TIME)
                    .ease(d3.easeQuadIn)
                    .style('height', null)
                    .on('end', function() {
                        if (cb) {
                            return cb();
                        }
                        return null;
                    })
                ;
            })
        ;
    }

    function hide(cb) {
        d3.select('h1')
            .transition('edit')
                .duration(consts.FADE_TIME * 2)
                .ease(d3.easeQuadOut)
                .style('width', '0px')
            .transition('h1edit')
                .ease(d3.easeQuadIn)
                .style('width', null)
                .on('start', function() {
                    d3.select(this).text('WORDFINDATRON');
                })
        ;

        d3.select('#editTools')
            .transition('edit')
            .duration(consts.FADE_TIME)
            .ease(d3.easeQuadOut)
            .style('height', '0px')
            .on('end', function() {
                d3.select(this)
                    .style('height', null)
                    .style('display', 'none')
                ;
                d3.select('#editorlist')
                    .transition('edit')
                    .duration(consts.FADE_TIME)
                    .ease(d3.easeQuadOut)
                    .style('width', '0px')
                    .on('end', function() {
                        d3.select(this)
                            .style('width', null)
                            .style('display', 'none')
                        ;
                        enable();
                        if (cb) {
                            return cb();
                        }
                        return null;
                    })
                ;
            })
        ;

    }

    // ==================================================================

    module.exports = {
        wipe: wipe,
        init: init,
        show: show,
        hide: hide,
        enable: enable,
        disable: disable
    };
}());
