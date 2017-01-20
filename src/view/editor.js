(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');
    var editorfield = require('./editorfield');
    var bubble = require('./bubble');

    var fields;
    var onChange;
    var bubbleHelp;

    // ==================================================================

    function updateBindings() {
        var gsize = parseInt(d3.select('#editGridSize').property('value'), 10);
        var list = d3.select('#editorlist');
        var lis = list.selectAll('li').data(fields);
        lis.enter()
            .append('li')
                .classed('editoritem', true)
                .attr('id', function(ef) { return ef.id(); })
                .style('width', '' + gsize + 'em')
                .append('input')
                    .attr('type', 'text')
                    .attr('value', function(ef) { return ef.word; })
                    .attr('maxlength', gsize)
                    .style('width', '' + gsize + 'em')
                    .on('change', function(ef) { return ef.onInput(); })
                    .on('input', function(ef) { return ef.onInput(); })
        ;
        lis.exit().remove();
        d3.select('.editoritem').each(function (ef) {
            ef.minlen = 3;
            ef.maxlen = gsize;
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
        fields.push(new editorfield.Field(fields.length, '', updateButtons));
        updateBindings();
        updateButtons();
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

    function updateGridSizeLabel() {
        var v = parseInt(d3.select('#editGridSize').property('value'), 10);
        d3.select('#labEditGridSize').html('<i class="fa fa-th fa-fw"></i> ' + v);
        return v;
    }

    function onGridSize() {
        var gsize = updateGridSizeLabel();
        d3.selectAll('.editoritem>input')
            .attr('maxlength', gsize)
            .style('width', '' + gsize + 'em')
        ;
        d3.selectAll('.editoritem>label')
            .style('right', '0')
        ;
        d3.selectAll('.editoritem').each(function (ef) {
            ef.minlen = 3;
            ef.maxlen = gsize;
            ef.validate();
        });
        updateButtons();
    }

    // ==================================================================

    function wipe() {
        d3.selectAll('.editoritem').remove();
        d3.select('#editCommit').on('click', null);
        d3.select('#editQuit').on('click', null);
        d3.select('#editAdd').on('click', null);
        d3.select('#editDelete').on('click', null);
        d3.select('#editGridSize').on('click', null);
        fields = [];
    }

    function init(puzzle, callbacks) {
        var scratchPuzzle = puzzle.copy();
        onChange = callbacks.onChange;

        var tb = d3.select('#editTools');
        tb.select('#editCommit').on('click', function () {
            var sz = parseInt(d3.select('#editGridSize').property('value'), 10);
            var sd = 0;
            var wl = fields.map(function(f) {
                return f.word;
            });
            bubbleHelp.hide(false);
            callbacks.onCommit(sz, sd, wl);
        });
        tb.select('#editQuit').on('click', function() {
            bubbleHelp.hide(false);
            callbacks.onQuit();
        }
        );

        tb.select('#editAdd').on('click', onAdd);
        tb.select('#editDelete').on('click', onDelete);
        tb.select('#editGridSize')
            .property('value', scratchPuzzle.size)
            .on('input', onGridSize)
            .on('change', onGridSize);
        updateGridSizeLabel();

        tb.select('#editShowHelp').on('click', onHelp);
        bubbleHelp = new bubble.Bubble('editHelp');
        bubbleHelp.below = true;

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
