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
    var bubble = require('./bubble');

    var thePuzzle, theTable, theWords, bubbleHelp;
    var rings = [];
    var inputDisabled = false, doingVictory = false;
    var hintWords;
    var rng = Random.engines.mt19937();
    rng.seed(new Date().getTime());

    // ==================================================================

    function failureClear() {
        d3.select('#error').style('display', 'none').style('position', 'relative');
    }
    function msgFailure(msg) {
        var errblk = d3.select('#error');
        errblk.style('display', 'block').style('position', 'relative');
        errblk.append('span').html(msg + '<br/>');
        var firstWord = d3.select('.editoritem');

        if (d3.select('#editorlist').style('display') !== 'none' && !firstWord.empty()) {
            var bFirstWord = firstWord.select('input').node().getBoundingClientRect();
            var x = bFirstWord.right + parseInt(errblk.style('font-size'), 10);
            var y = bFirstWord.top;
            errblk.style('position', 'absolute')
                .style('top', '' + y + 'px')
                .style('left', '' + x + 'px')
            ;
        }
    }

    function msgClear() {
        d3.selectAll('#message span').remove();
        d3.selectAll('#error span').remove();
        failureClear();
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
        toolbar.setUndoable(rings.length > 0);
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
        toolbar.setUndoable(rings.length > 0);
    }

    function clearRings(tween) {
        while (rings.length > 0) {
            popRing(tween);
        }
        toolbar.setUndoable(rings.length > 0);
    }

    // ==================================================================

    function doVictory() {
        if (doingVictory) {
            return;
        }
        doingVictory = true;
        d3.selectAll('.ring').style('z-index', -3);
        var ftable = function(r) {
            theTable.flashVictory(r, true);
        };
        for (var wordi=0; wordi<theWords.length; wordi++) {
            theWords[wordi].doVictory(wordi, consts.FADE_TIME);
            ringForAnswer(theWords[wordi].answer).doVictory(wordi, consts.FADE_TIME, ftable);
        }
        theTable.fadeUnsolved(theWords.length, rng, consts.FADE_TIME);
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
        doingVictory = false;
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

    function checkAnswers(checkVictory, tweent) {
        if (tweent === true) {
            tweent = consts.FADE_TIME;
        }
        var answered = 0;
        var awords = [], marked = [];
        for (var ri=0; ri<rings.length; ri++) {
            var answer = checkWord(rings[ri].startCell, rings[ri].endCell, rings[ri].word);
            if (!answer) {
                // FIXME? will break on unicode
                var reversed = rings[ri].word.split('').reverse().join('');
                answer = checkWord(rings[ri].endCell, rings[ri].startCell, reversed);
            }

            if (answer) {
                rings[ri].mark(answer, tweent, true);
                marked = marked.concat(theTable.markAnswer(answer, true));
                awords.push(answer.word);
                answered++;
            } else {
                rings[ri].mark(tweent, false);
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

        for (var wi=0; wi<theWords.length; wi++) {
            theWords[wi].mark((awords.indexOf(theWords[wi].word) !== -1));
        }

        if (checkVictory && answered === thePuzzle.answers.length) {
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
        if (inputDisabled || doingVictory) {
            return;
        }
        drag.cancelDrag(true);
        drag.createDrag(d, true, function() {
            toolbar.setUndoable(rings.length > 0);
        });
    }

    function onDragMoveLetter() {
        if (inputDisabled || doingVictory) {
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
        if (inputDisabled || doingVictory) {
            return;
        }
        if (!drag.dragging()) {
            return;
        }
        var r = drag.finishDrag(true);
        if (r) {
            rings.push(r);
        }
        toolbar.setUndoable(rings.length > 0);
        checkAnswers(true, true);
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
                    checkAnswers(true, true);
                    fanswer(i+1);
                };
                drag.continueDrag(theTable, cpos.x+dragRing.size, cpos.y+dragRing.size, consts.TWEEN_TIME, transitcb);
            };
            fcell();
        };
        fanswer(0);
    }

    function rebindWordList() {
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
                .style('display', 'inline')
                .text(function(d) { return d.word; })
        ;
    }

    function onReset(tweent) {
        bubbleHelp.hide(tweent);
        drag.cancelDrag(tweent);
        cancelVictory();
        clearRings(tweent);
        checkAnswers(tweent, tweent);
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

        theWords = [];
        for (var i=0; i<thePuzzle.answers.length; i++) {
            theWords.push(new listword.ListWord(i, thePuzzle.answers[i]));
        }
        rebindWordList();

        bubbleHelp = new bubble.Bubble('playHelp');

        editor.init(thePuzzle, {
            onChange: function() { // misc edits
                failureClear();
            },
            onQuit: function() {
                msgClear();
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
                msgClear();
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

        toolbar.init({
            onUndo: function() {
                popRing(true);
                cancelVictory();
                checkAnswers(false, true);
            },
            onReset: function() {
                onReset(true);
            },
            onHint: function() {
                showHint();
            },
            onHelp: function() {
                if (bubbleHelp.isVisible()) {
                    bubbleHelp.hide(d3.select(this), true);
                } else {
                    bubbleHelp.show(d3.select(this), true);
                }
            },
            onShuffle: function() {
                msgClear();
                onReset(false);
                var newPuzzle = cbCommitEdit(
                    thePuzzle.size,
                    0,
                    thePuzzle.answers.map(function(a) {
                        return a.word;
                    }));
                if (newPuzzle) {
                    displayPuzzle(newPuzzle, cbNewPuzzle, cbCommitEdit);
                    checkAnswers(false, true);
                }
            },
            onNew: function() {
                msgClear();
                onReset(false);
                hideGame(function() {
                    cbNewPuzzle(toolbar.getGridSize(), toolbar.getNumWords());
                    showGame(function() {
                        checkAnswers(false, true);
                    });
                });
            },
            onEdit: function() {
                disableInput();
                onReset(false);
                toolbar.hide(function() {
                    hideGame(function() {
                        editor.show(function() {
                            enableInput();
                        });
                    });
                });
            },
            onSolve: function() {
                onReset(false);
                autosolve();
            },
            onShare: function() {
                var serialized = thePuzzle.serialize();
                window.open('?p='+serialized, '_blank');
            }
        });
        toolbar.setUndoable(rings.length > 0);

        enableInput();
        theTable = new table.Table(thePuzzle);
    }

    // ==================================================================

    module.exports = {
        displayPuzzle: displayPuzzle,
        msgClear: msgClear,
        msgWrite: msgWrite,
        msgFailure: msgFailure,
        disableInput: disableInput,
        enableInput: enableInput,
        getGridSize: toolbar.getGridSize,
        getNumWords: toolbar.getNumWords,
        getSeed: toolbar.getSeed
    };
}());
