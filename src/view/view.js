(function() {
    'use strict';

    var Random = require('random-js');
    var d3 = require('d3');
    var consts = require('../consts');
    var util = require('../util');
    var colors = require('./colors');
    var cell = require('./cell');
    var ring = require('./ring');
    var listword = require('./listword');
    var drag = require('./drag');
    var table = require('./table');
    var toolbar = require('./toolbar');
    var editor = require('./editor');

    var thePuzzle, theTable, theWordlist;
    var rings = [];
    var inputDisabled = false;
    var hintWords;
    var rng = Random.engines.mt19937();
    rng.seed(new Date().getTime());

    // ==================================================================

    function getGridSize() {
        return toolbar.getGridSize();
    }
    function getNumWords() {
        return toolbar.getNumWords();
    }
    function getSeed() {
        return toolbar.getSeed();
    }

    // ==================================================================

    function msgClear() {
        d3.selectAll('#message span').remove();
    }
    function msgWrite() {
        var s = '';
        for (var i=0; i<arguments.length; i++) {
            s += '['+arguments[i]+'] ';
        }
        d3.select('#message').append('span').html(s + '<br/>');
    }

    // ==================================================================

    function disableInput() {
        inputDisabled = true;
        toolbar.disable();
        editor.disable();
    }

    function enableInput() {
        inputDisabled = false;
        toolbar.enable();
        editor.enable();
    }

    // ==================================================================

    function ringForAnswer(a) {
        for (var i=0; i<rings.length; i++) {
            if (rings[i].answer === a) {
                return rings[i];
            }
        }
        return null;
    }

    function popRing(tween) {
        if (rings.length === 0) {
            return;
        }
        var r = rings.pop();
        r.destroy(tween);
    }

    function clearRings(tween) {
        while (rings.length > 0) {
            popRing(tween);
        }
    }

    // ==================================================================

    function doVictory() {
        d3.selectAll('.cell')
            .filter(function() { return !d3.select(this).classed('cellsolved'); })
            .transition('victory')
            .duration(consts.FADE_TIME * thePuzzle.answers.length * 2)
            .ease(d3.easeQuadOut)
            .style('color', colors.bodyBg)
        ;
        d3.selectAll('.ring').style('z-index', -3);
        for (var i=0; i<theWordlist.length; i++) {
            theWordlist[i].doVictory(i, consts.FADE_TIME);
            ringForAnswer(theWordlist[i].answer).doVictory(i, consts.FADE_TIME);
        }
    }

    function cancelVictory() {
        d3.selectAll('.cell').interrupt('victory');
        d3.selectAll('.cell')
            .filter(function() {
                return !d3.select(this).classed('cellsolved');
            })
            .style('color', null)
        ;
        d3.selectAll('#wflist>li').interrupt('victory');
        d3.selectAll('.wfsolved')
            .style('background-color', colors.bodyText);
        d3.selectAll('.ring').interrupt('victory');
        d3.selectAll('.ringsolved')
            .style('background-color', colors.bodyText)
            .style('border-color', colors.bodyText);
    }

    function hideGame(cb) {
        d3.select('#info')
            .transition('game')
                .duration(consts.FADE_TIME)
                .ease(d3.easeQuadOut)
                .style('width', '0px')
            .on('end', function () {
                d3.select(this).style('display', 'none').style('width', null);
                d3.select('#playField')
                    .transition('game')
                        .duration(consts.FADE_TIME)
                        .ease(d3.easeQuadOut)
                        .style('width', '0px')
                    .on('end', function () {
                        d3.select(this).style('display', 'none').style('width', null);
                        if (cb) {
                            return cb();
                        }
                        return null;
                    });
            })
        ;
        d3.select('#playHelp')
            .transition('game')
                .duration(consts.FADE_TIME)
                .ease(d3.easeQuadOut)
                .style('height', '0px')
            .on('end', function() {
                d3.select(this).style('height', null).style('display', 'none');
            })
        ;
    }

    function showGame(cb) {
        d3.select('#playField')
                .style('display', 'inline-block')
                .style('width', '0px')
            .transition('game')
                .duration(consts.FADE_TIME)
                .ease(d3.easeQuadIn)
                .style('width', null)
            .on('end', function() {
                d3.select('#info')
                        .style('display', 'inline-block')
                        .style('width', '0px')
                    .transition('game')
                        .duration(consts.FADE_TIME)
                        .ease(d3.easeQuadIn)
                        .style('width', null)
                    .on('end', function () {
                        d3.select('#playHelp')
                                .style('display', 'block')
                                .style('height', '0px')
                            .transition('game')
                                .duration(consts.FADE_TIME)
                                .ease(d3.easeQuadIn)
                                .style('height', null)
                        ;
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

    function checkWord(c, d, w) {
        for (var i=0; i<thePuzzle.answers.length; i++) {
            var a = thePuzzle.answers[i];
            if (a.word === w &&
                c.x === a.startLocation.x && c.y === a.startLocation.y &&
                d.x === a.endLocation.x && d.y === a.endLocation.y) {
                return a;
            }
        }
        return null;
    }

    function checkAnswers() {
        var answered = 0;
        var awords = [], marked = [];
        for (var ri=0; ri<rings.length; ri++) {
            var answer = checkWord(rings[ri].startCell, rings[ri].endCell, rings[ri].word);
            if (!answer) {
                // FIXME: will break on unicode
                var revword = rings[ri].word.split('').reverse().join('');
                answer = checkWord(rings[ri].endCell, rings[ri].startCell, revword);
            }

            if (answer) {
                rings[ri].mark(answer, consts.FADE_TIME, true);
                marked = marked.concat(theTable.markAnswer(answer, true));
                awords.push(answer.word);
                answered++;
            } else {
                rings[ri].mark(consts.FADE_TIME, false);
            }
        }

        // if an answer ring was removed, reset affected cells.
        d3.selectAll('.cellsolved').each(function (d) {
            if (marked.indexOf(d) === -1) {
                var s = d3.select(this);
                if (s.classed('cellsolved')) {
                    s.classed('cellsolved', false);
                }
            }
        });

        for (var wi=0; wi<theWordlist.length; wi++) {
            theWordlist[wi].mark((awords.indexOf(theWordlist[wi].word) !== -1));
        }

        if (answered === thePuzzle.answers.length) {
            doVictory();
        }
    }

    // ==================================================================

    function showHint(depth) {
        if (typeof depth === 'undefined') {
            depth = 0;
        }
        if (depth > thePuzzle.answers.length) {
            util.log('showHint: retry depth exceeded, something is very wrong');
            return null;
        }
        if (!hintWords || hintWords.length === 0) {
            hintWords = d3.selectAll('#wflist>li')
                .filter(function (d) { return !d.isSolved(); })
                .data()
            ;
            Random.shuffle(rng, hintWords);
        }
        if (hintWords.length === 0) {
            util.log('showHint: Nothing to hint at');
            return null;
        }

        var hw = hintWords.shift();
        // did this word get solved since the last time we reshuffled?
        if (hw.isSolved()) {
            return showHint(depth+1);
        }
        theTable.flashHint(hw.answer);
        return hw.answer;
    }

    // ==================================================================

    function onDragStartLetter(d) {
        if (inputDisabled) {
            return;
        }
        drag.cancelDrag(true);
        drag.createDrag(d, true);
    }

    function onDragMoveLetter() {
        if (inputDisabled) {
            return;
        }
        if (!drag.dragging()) {
            return;
        }
        if (d3.event.sourceEvent.type === 'touchmove') {
            if (d3.event.sourceEvent.touches.length > 0) {
                drag.continueDrag(theTable, d3.event.sourceEvent.touches.item(0).clientX, d3.event.sourceEvent.touches.item(0).clientY, true);
            }
        } else {
            drag.continueDrag(theTable, d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY, true);
        }
    }

    function onDragEndLetter() {
        if (inputDisabled) {
            return;
        }
        if (!drag.dragging()) {
            return;
        }
        var r = drag.finishDrag(true);
        if (r) {
            rings.push(r);
        }
        checkAnswers();
    }

    // ==================================================================

    function autosolve() {
        disableInput();
        var fanswer = function(i) {
            if (i >= thePuzzle.answers.length) {
                enableInput();
                return;
            }
            var answer = thePuzzle.answers[i];
            var startCell = theTable.getCell(answer.startLocation.x, answer.startLocation.y);
            var dragRing = drag.createDrag(startCell, false);
            var coords = answer.getCellCoordinates();
            var cooi = -1;

            var fcell = function() {
                if (++cooi >= coords.length) {
                    return;
                }
                var x = coords[cooi].x;
                var y = coords[cooi].y;
                var cc = theTable.getCell(x, y);
                var cpos = cc.getPagePosition();
                var transitcb = (x!==answer.endLocation.x || y!==answer.endLocation.y) ? fcell : function() {
                    var r = drag.finishDrag(false);
                    if (r) {
                        rings.push(r);
                    }
                    checkAnswers();
                    fanswer(i+1);
                };
                drag.continueDrag(theTable, cpos.x+dragRing.size, cpos.y+dragRing.size, consts.TWEEN_TIME, transitcb);
            };
            fcell();
        };
        fanswer(0);
    }

    // the info column should be skinny if it's next to the grid, but wide if it's below it.
    //var infoWidthState;
    function setInfoWidth() {
        /*
        var g = d3.select('#wfgrid');
        var i = d3.select('#info');
        var grect = g.node().getBoundingClientRect();
        var gw = g.style('width');
        var irect = i.node().getBoundingClientRect();
        if (irect.top === grect.top) {
            if (infoWidthState !== 2) {
                i.style('width', null);
                i.style('min-width', null);
                i.style('max-width', gw);
                infoWidthState = 2;
            }
        } else if (infoWidthState !== 1) {
            i.style('width', gw);
            i.style('min-width', gw);
            i.style('max-width', gw);
            infoWidthState = 1;
        }
        */
    }

    function rebindWordList() {
        var ul = d3.select('#wflist');
        var lis = ul.selectAll('li').data(theWordlist);
        lis.enter()
            .append('li')
            .attr('id', function(d) { return d.id(); })
            .classed('wfword', true)
            .classed('wfsolved', false)
        ;
        lis.exit().remove();
        ul.selectAll('li').append('span')
                .style('display', 'inline')
                .text(function(d) { return d.word; })
        ;
    }


    function displayPuzzle(puz, cbNewPuzzle, cbCommitEdit) {
        thePuzzle = puz;
        util.log(thePuzzle.seed);
        hintWords = null;
        d3.select('#message').text('');
        d3.selectAll('#wflist li').remove();
        table.wipe();
        toolbar.wipe();
        editor.wipe();
        var body = d3.select('body');

        // Create dummy elements to get CSS derived metrics
        {
            var dummy = body.append('td').classed('cell', true);
            var cw = parseInt(dummy.style('width'), 10) * thePuzzle.size;
            d3.select('#wfgrid')
                .style('width', cw + 'px')
                .style('min-width', cw + 'px');
            d3.selectAll('.help').style('width', cw + 'px');
            dummy.remove();

            dummy = body.append('div').classed('ring', true);
            ring.Ring.prototype.borderSize = parseInt(dummy.style('border-top-width'), 10);
            ring.Ring.prototype.size = parseInt(dummy.style('width'), 10);
            ring.Ring.prototype.solvedColor = dummy.style('color');
            ring.Ring.prototype.bgColor = dummy.style('background-color');
            ring.Ring.prototype.borderColor = dummy.style('border-top-color');
            colors.setColor('ring', dummy.style('border-top-color'));
            dummy.remove();

            dummy = body.append('div').classed('wfword', true);
            colors.setColor('bodyBg', dummy.style('background-color'));
            colors.setColor('bodyText', dummy.style('color'));
            dummy.remove();

            dummy = body.append('div').classed('warning', true);
            colors.setColor('warningText', dummy.style('color'));
            dummy.remove();
        }

        // build the grid
        {
            var rows = d3.select('#wfgrid tbody').selectAll('tr')
                .data(thePuzzle.grid.grid)
                .enter()
                .append('tr')
            ;

            var r = 0;
            var cells = rows.selectAll('td')
                .data(function(row) {
                    var c = 0;
                    var rv = row.map(function(s) {
                        return new cell.Cell(s, c++, r);
                    });
                    r++;
                    return rv;
                })
                .enter()
                .append('td')
                .attr('id', function(d) { return d.id(); })
                .classed('cell', true)
            ;

            cells.call(d3.drag()
                .on('start', onDragStartLetter)
                    .on('drag', onDragMoveLetter)
                    .on('end', onDragEndLetter)
            );
            cells.append('div')
                .classed('gc', true)
                .text(function(d) { return d.letter; })
            ;

            cells.each(function(d) {
                d.element = this;
                d.selection = d3.select(this);
                d.size = parseInt(d3.select(this).style('width'), 10);
            });
        }

        theWordlist = [];
        for (var i=0; i<thePuzzle.answers.length; i++) {
            theWordlist.push(new listword.ListWord(i, thePuzzle.answers[i]));
        }
        rebindWordList();

        editor.init(thePuzzle, {
            onQuit: function() {
                disableInput();
                editor.hide(function() {
                    toolbar.show(function() {
                        showGame(function() {
                            enableInput();
                        });
                    });
                });
            },
            onCommit: function(csz, csd, cwl) {
                if (cbCommitEdit) {
                    var newPuzzle = cbCommitEdit(csz, csd, cwl);
                    if (newPuzzle) {
                        disableInput();
                        editor.hide(function() {
                            displayPuzzle(newPuzzle, cbNewPuzzle, cbCommitEdit);
                            toolbar.show(function() {
                                showGame(function() {
                                    enableInput();
                                });
                            });
                        });
                    }
                }
            }
        });

        setInfoWidth();
        d3.select(window).on('resize', setInfoWidth);

        toolbar.init({
            onUndo: function() {
                popRing(true);
                cancelVictory();
                checkAnswers();
            },
            onReset: function() {
                drag.cancelDrag(true);
                clearRings(true);
                cancelVictory();
                checkAnswers();
            },
            onHint: function() {
                showHint();
            },
            onNew: function() {
                drag.cancelDrag(false);
                clearRings(false);
                cbNewPuzzle(getGridSize(), getNumWords());
                checkAnswers();
            },
            onEdit: function() {
                disableInput();
                clearRings(false);
                cancelVictory();
                checkAnswers();
                toolbar.hide(function() {
                    hideGame(function() {
                        editor.show(function() {
                            enableInput();
                        });
                    });
                });
            },
            onSolve: function() {
                drag.cancelDrag(true);
                clearRings(false);
                checkAnswers();
                autosolve();
            }
        });

        if (thePuzzle.seed) {
            var u = '?p=' + thePuzzle.serialize();
            d3.select('#permalink').html('').append('a')
                .attr('href', u)
                .text('permalink');
        } else {
            d3.select('#permalink').html('');
        }

        enableInput();
        theTable = new table.Table(thePuzzle);
    }

    // ==================================================================

    module.exports = {
        displayPuzzle: displayPuzzle,
        msgClear: msgClear,
        msgWrite: msgWrite,
        getGridSize: getGridSize,
        getNumWords: getNumWords,
        getSeed: getSeed,
        disableInput: disableInput,
        enableInput: enableInput
    };
}());
