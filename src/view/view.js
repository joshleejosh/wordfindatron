(function() {
    'use strict';

    var Random = require('random-js');
    var d3 = require('d3');
    var consts = require('../consts');
    var util = require('../util');
    var viewutil = require('./viewutil');
    var drag = require('./drag');
    var wordlist = require('./wordlist');
    var table = require('./table');
    var toolbar = require('./toolbar');
    var editor = require('./editor');
    var bubble = require('./bubble');
    var keys = require('./keys');
    var sharing = require('./sharing');

    var thePuzzle, theTable;
    var cbNewPuzzle, cbCommitEdit;
    var bubbleHelp, bubbleWarning;
    var rings = [];
    var inputDisabled = false, doingVictory = false;
    var hintWords;
    var rng = Random.engines.mt19937();
    rng.seed(new Date().getTime());

    // ==================================================================

    function failureClear() {
        if (!bubbleWarning) {
            bubbleWarning = new bubble.Bubble('error');
            bubbleWarning.below = true;
        }
        bubbleWarning.hide(d3.select('h1'), true);
    }
    function msgFailure(msg) {
        if (!bubbleWarning) {
            bubbleWarning = new bubble.Bubble('error');
            bubbleWarning.below = true;
        }
        var errblk = d3.select('#error');
        errblk.html('').append('span').html(msg + '<br/>');
        bubbleWarning.show(d3.select('h1'), true);
    }

    function msgClear() {
        d3.select('#message').html('');
        failureClear();
    }
    function msgWrite() {
        var s = '';
        for (var i=0; i<arguments.length; i++) {
            s += '[' + arguments[i] + '] ';
        }
        d3.select('#message').append('span').html(s + '<br/>');
    }

    // ==================================================================

    function checkInput() {
        if (inputDisabled) {
            toolbar.disable();
            editor.disable();
        } else {
            toolbar.enable();
            editor.enable();
            toolbar.setUndoable(rings.length > 0);
            toolbar.setHintable(!doingVictory);
        }
    }

    function disableInput() {
        inputDisabled = true;
        checkInput();
    }

    function enableInput() {
        inputDisabled = false;
        checkInput();
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
        disableInput();
        d3.selectAll('.ring').style('z-index', -3);

        var listwords = wordlist.getListWords();
        var ftable = function(r) {
            theTable.flashVictory(r, true);
        };
        // reenable input after the last ring finishes flashing.
        var ffLast = function(i) {
            return function() {
                if (i === listwords.length - 1) {
                    enableInput();
                }
            };
        };

        for (var wordi=0; wordi<listwords.length; wordi++) {
            listwords[wordi].doVictory(wordi, consts.FADE_TIME);
            var r = ringForAnswer(listwords[wordi].answer);
            r.doVictory(wordi, consts.FADE_TIME, ftable, ffLast(wordi));
        }
        theTable.fadeUnsolved(listwords.length, rng, consts.FADE_TIME);
    }

    function cancelVictory() {
        d3.selectAll('.cell').interrupt('cell.victory');
        d3.selectAll('.cell').style('color', null);
        d3.selectAll('#wflist>li').interrupt('listword.victory');
        d3.selectAll('.wfsolved')
            .style('background-color', viewutil.metrics.color.lowlight);
        d3.selectAll('.ring').interrupt('ring.victory');
        d3.selectAll('.ringsolved')
            .style('background-color', viewutil.metrics.color.lowlight)
            .style('border-color', viewutil.metrics.color.lowlight);
        doingVictory = false;
    }

    function hideGame(cb) {
        wordlist.hide(consts.FADE_TIME, function() {
            d3.select('#playField')
                .style('overflow', 'hidden')
                .transition('game')
                .duration(consts.FADE_TIME)
                .ease(d3.easeQuadOut)
                .style('width', '0px')
                .on('end', function () {
                    d3.select(this)
                        .style('display', 'none')
                        .style('overflow', 'visible')
                        .style('width', null);
                    if (cb) {
                        return cb();
                    }
                    return null;
                });
        });
    }

    function showGame(cb) {
        d3.select('#playField')
                .style('display', 'inline-block')
                .style('overflow', 'hidden')
                .style('width', '0px')
            .transition('game')
                .duration(consts.FADE_TIME)
                .ease(d3.easeQuadIn)
                .style('width', null)
            .on('end', function() {
                d3.select(this).style('overflow', 'visible');
                wordlist.show(consts.FADE_TIME, cb);
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
        tweent = viewutil.fadeTime(tweent);
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

        var listwords = wordlist.getListWords();
        for (var wi=0; wi<listwords.length; wi++) {
            listwords[wi].mark((awords.indexOf(listwords[wi].word) !== -1));
        }

        if (checkVictory && answered === thePuzzle.answers.length) {
            doVictory();
        }
        checkInput();
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
                .filter(function (lw) { return !lw.isSolved(); })
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

    function onReset(tweent) {
        if (typeof tweent === 'undefined') {
            tweent = true;
        }
        bubbleHelp.hide(null, tweent);
        bubbleWarning.hide(null, tweent);
        drag.cancelDrag(tweent);
        cancelVictory();
        clearRings(tweent);
        checkAnswers(tweent, tweent);
    }

    function onUndo() {
        popRing(true);
        cancelVictory();
        checkAnswers(false, true);
    }

    function onHelp(caller) {
        caller = d3.select('#tbHelp');
        if (caller.empty()) {
            caller = d3.select('h1');
        }
        if (bubbleHelp.isVisible()) {
            bubbleHelp.hide(caller, true);
        } else {
            bubbleHelp.show(caller, true);
        }
    }

    function onShuffle() {
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
        } else {
            msgFailure(consts.MSG_SHUFFLE_FAIL);
        }
    }

    function onNew() {
        msgClear();
        disableInput();
        onReset(false);
        hideGame(function() {
            msgClear();
            msgWrite('Thinking&hellip;');
            cbNewPuzzle();
            showGame();
        });
    }

    function onEdit() {
        disableInput();
        onReset(false);
        toolbar.hide(function() {
            hideGame(function() {
                editor.show(function() {
                    enableInput();
                });
            });
        });
    }

    function onEditorQuit() {
        msgClear();
        disableInput();
        editor.hide(function() {
            toolbar.show(function() {
                showGame(function() {
                    enableInput();
                });
            });
        });
    }

    function onEditorCommit(csz, csd, cwl) {
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
            } else {
                msgFailure('Couldn\'t create a puzzle');
            }
        }
    }

    // ==================================================================

    function onSolve() {
        onReset(false);
        disableInput();
        var fanswer = function(i) {
            if (i >= thePuzzle.answers.length) {
                return;
            }
            var answer = thePuzzle.answers[i];
            var startCell = theTable.getCell(answer.startLocation.x, answer.startLocation.y);
            drag.createDrag(startCell, false);
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
                drag.continueDrag(theTable, cpos.x+viewutil.metrics.ring.size, cpos.y+viewutil.metrics.ring.size, consts.TWEEN_TIME, transitcb);
            };
            fcell();
        };
        fanswer(0);
    }

    // ==================================================================

    function resize() {
        viewutil.initMetrics(thePuzzle);
        theTable.resize();
        wordlist.resize();
        for (var ri=0; ri<rings.length; ri++) {
            rings[ri].resize();
        }
        toolbar.resize();
    }

    function displayPuzzle(puz, cbnew, cbcommit) {
        thePuzzle = puz;
        cbNewPuzzle = cbnew;
        cbCommitEdit = cbcommit;
        if (puz && puz.statKeeper) {
            puz.statKeeper.report();
        } else {
            util.log('' + puz.size + ' ' + puz.seed);
        }
        hintWords = null;
        msgClear();
        d3.selectAll('#wflist li').remove();
        table.wipe();
        editor.wipe();

        // Create dummy elements to get CSS derived metrics
        viewutil.initMetrics(thePuzzle);

        theTable = new table.Table(thePuzzle);
        theTable.rebind(onDragStartLetter, onDragMoveLetter, onDragEndLetter);

        wordlist.rebind(thePuzzle);

        editor.init(thePuzzle, {
            onChange: function() { // misc edits
                failureClear();
            },
            onQuit: onEditorQuit,
            onCommit: onEditorCommit
        });

        toolbar.init({
            onUndo: onUndo,
            onReset: onReset,
            onHint: showHint,
            onHelp: onHelp,
            onShuffle: onShuffle,
            onNew: onNew,
            onEdit: onEdit,
            onSolve: onSolve
        });
        toolbar.setUndoable(rings.length > 0);
        toolbar.writeGridSize(thePuzzle.size);
        toolbar.writeDensity(thePuzzle.density());

        bubbleHelp = new bubble.Bubble('playHelp');
        bubbleHelp.below = true;
        bubbleHelp.owner = d3.select('#tbHelp');

        //bubbleWarning = new bubble.Bubble('error');
        //bubbleWarning.below = true;

        enableInput();

        d3.select(window).on('resize', resize);
        resize();
        keys.bind({
            canDo: function() {
                return (!inputDisabled && !editor.visible());
            },
            onUndo: onUndo,
            onReset: onReset,
            onHint: showHint,
            onHelp: onHelp,
            onShuffle: onShuffle,
            onNew: onNew,
            onEdit: onEdit,
            onSolve: onSolve
        });
        sharing.setLinks(thePuzzle);
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
        getDensity: toolbar.getDensity,
        writeGridSize: toolbar.writeGridSize,
        writeDensity: toolbar.writeDensity
    };
}());
