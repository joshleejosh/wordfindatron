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

    var thePuzzle, theTable;
    var rings = [];
    var inputDisabled = false;
    var hintWords;
    var rng = Random.engines.mt19937();
    rng.seed(new Date().getTime());

    // ==================================================================

    function updateLabel(id, v, suffix) {
        d3.select('#'+id).html(v + ' &mdash; ' + suffix);
    }

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
        var d = d3.select('#tbSeed');
        var rv = parseInt(d.property('value'), 10);
        return rv;
    }
    function writeSeed(v) {
        d3.select('#tbSeed').property('value', v);
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
        d3.selectAll('#toolbar button').attr('disabled', true);
        d3.selectAll('#toolbar input').attr('disabled', true);
    }

    function enableInput() {
        inputDisabled = false;
        d3.selectAll('#toolbar button').attr('disabled', null);
        d3.selectAll('#toolbar input').attr('disabled', null);
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
            .transition()
            .duration(consts.FADE_TIME * thePuzzle.answers.length * 2)
            .ease(d3.easeSinOut)
            .style('color', colors.bodyBg)
        ;

        d3.selectAll('.ring').style('z-index', -3);

        var i = 0;
        d3.selectAll('#wflist>li').each(function (d) {
            d.doVictory(i, consts.FADE_TIME);
            ringForAnswer(d.answer).doVictory(i, consts.FADE_TIME);
            i++;
        });
    }

    function cancelVictory() {
        d3.selectAll('.cell').interrupt();
        d3.selectAll('.cell')
            .filter(function() {
                return !d3.select(this).classed('cellsolved');
            })
            .style('color', null)
        ;
        d3.selectAll('#wflist>li').interrupt();
        d3.selectAll('.wfsolved')
            .style('background-color', colors.bodyText);
        d3.selectAll('.ring').interrupt();
        d3.selectAll('.ringsolved')
            .style('background-color', colors.bodyText)
            .style('border-color', colors.bodyText);
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
        for (var i=0; i<rings.length; i++) {
            var answer = checkWord(rings[i].startCell, rings[i].endCell, rings[i].word);
            if (!answer) {
                // FIXME: will break on unicode
                var revword = rings[i].word.split('').reverse().join('');
                answer = checkWord(rings[i].endCell, rings[i].startCell, revword);
            }

            if (answer) {
                rings[i].mark(answer, consts.FADE_TIME, true);
                marked = marked.concat(theTable.markAnswer(answer, true));
                awords.push(answer.word);
                answered++;
            } else {
                rings[i].mark(consts.FADE_TIME, false);
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

        d3.selectAll('#wflist>li').each(function (d) {
            d.mark((awords.indexOf(d.word) !== -1));
        });

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

    var infoWidthState;
    function setInfoWidth() {
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
    }

    function displayPuzzle(puz, cbNewPuzzle) {
        thePuzzle = puz;
        hintWords = null;
        d3.select('#message').text('');
        d3.selectAll('#wfgrid tr').remove();
        d3.selectAll('#wflist li').remove();
        var body = d3.select('body');

        // Create dummy elements to get CSS derived metrics
        {
            var szdummy = body.append('td').classed('cell', true);
            var cw = parseInt(szdummy.style('width'), 10) * thePuzzle.size;
            d3.select('#wfgrid')
                .style('width', cw + 'px')
                .style('min-width', cw + 'px');
            d3.select('#help').style('width', cw + 'px');
            szdummy.remove();

            szdummy = body.append('div').classed('ring', true);
            ring.Ring.prototype.borderSize = parseInt(szdummy.style('border-top-width'), 10);
            ring.Ring.prototype.size = parseInt(szdummy.style('width'), 10);
            ring.Ring.prototype.solvedColor = szdummy.style('color');
            ring.Ring.prototype.bgColor = szdummy.style('background-color');
            ring.Ring.prototype.borderColor = szdummy.style('border-top-color');
            colors.setColor('ring', szdummy.style('border-top-color'));
            szdummy.remove();

            szdummy = body.append('div').classed('wfword', true);
            colors.setColor('bodyBg', szdummy.style('background-color'));
            colors.setColor('bodyText', szdummy.style('color'));
            szdummy.remove();
        }


        // build the grid
        {
            var rows = body.select('#wfgrid tbody').selectAll('tr')
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


        // build the word list
        {
            var ul = body.select('#wflist');
            ul.selectAll('li')
                .data(thePuzzle.answers.map(function(a) {
                    return new listword.ListWord(a);
                }))
                .enter()
                .append('li')
                .attr('id', function(d) { return 'wflist_' + d.word; })
                .classed('wfword', true)
                .classed('wfsolved', false)
                .text(function(d) { return d.word; })
            ;
        }

        //minInfoWidth = d3.select('#info').style('width');
        setInfoWidth();
        d3.select(window).on('resize', setInfoWidth);

        // configure the toolbar
        {
            var toolbar = d3.select('#toolbar');
            body.select('#tbUndo').on('click', function() {
                popRing(true);
                cancelVictory();
                checkAnswers();
            });

            body.select('#tbReset').on('click', function() {
                drag.cancelDrag(true);
                clearRings(true);
                cancelVictory();
                checkAnswers();
            });

            body.select('#tbHint').on('click', function() {
                showHint();
            });

            body.select('#tbNew').on('click', function() {
                drag.cancelDrag(false);
                clearRings(false);
                cbNewPuzzle(getGridSize(), getNumWords());
                checkAnswers();
            });

            body.select('#tbShowAdv').on('click', function() {
                var a = body.select('#tbadvanced');
                var b = a.style('display');
                b = (b === 'none') ? 'block' : 'none';
                a.style('display', b);
                if (b === 'none') {
                    d3.select(this).text('options');
                } else {
                    d3.select(this).text('(hide)');
                }
            });

            updateLabel('labTbSize', getGridSize(), 'Grid Size');
            body.select('#tbSize')
                .on('input', function() {
                    updateLabel('labTbSize', getGridSize(), 'Grid Size');
                })
                .on('change', function() {
                    updateLabel('labTbSize', getGridSize(), 'Grid Size');
                });

            updateLabel('labTbWords', getNumWords(), '# Words');
            body.select('#tbWords')
                .on('input', function() {
                    updateLabel('labTbWords', getNumWords(), '# Words');
                })
                .on('change', function() {
                    updateLabel('labTbWords', getNumWords(), '# Words');
                });

            if (consts.CHEAT && d3.select('#tbSolve').empty()) {
                toolbar.insert('button', '#tbNew')
                    .attr('id', 'tbSolve')
                    .attr('type', 'button')
                    .text('Solve')
                    .on('click', function() {
                        drag.cancelDrag(true);
                        clearRings(false);
                        checkAnswers();
                        autosolve();
                    })
                ;
                toolbar.insert('span', '#tbNew').text(' ');
            }

            toolbar.on('submit', function() {
                d3.event.preventDefault();
            });

        }

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
        writeGridSize: writeGridSize,
        writeNumWords: writeNumWords,
        writeSeed: writeSeed,
        disableInput: disableInput,
        enableInput: enableInput
    };
}());
