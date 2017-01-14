(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('./consts');
    var util = require('./util');
    var viewcell = require('./viewcell');
    var viewring = require('./viewring');

    var cells, wordlist;
    var puzzle;
    var rings = [];
    var dragRing;
    var inputDisabled = false;
    var colors = {};

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

    function wordBetweenCells(c, d) {
        if (c.row===d.row && c.column===d.column) {
            return c.letter;
        }
        var parms = puzzle.grid.coordsToSlice(c.column, c.row, d.column, d.row);
        var word = puzzle.grid.readWord(parms[0], parms[1], parms[2], parms[3]);
        return word;
    }

    // ==================================================================

    /*
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
*/

    // ==================================================================

    function getCell(r, c) {
        var td = d3.select('#' + viewcell.cid(r, c));
        return td.datum();
    }

    // annotate all data with their x/y/size in page space.
    function recordCellSizes() {
        cells.each(function(d) {
            d.element = this;
            d.selection = d3.select(this);
            d.size = parseInt(d3.select(this).style('width'), 10);
        });
    }

    // ==================================================================

    function doVictory() {
        d3.selectAll('.cell')
            .filter(function() { return !d3.select(this).classed('cellsolved'); })
            .transition()
            .duration(consts.FADE_TIME)
            .style('color', colors.ring)
        ;

        d3.selectAll('.ring').style('z-index', -3);

        var ft = (consts.FADE_TIME * 2) + 1;
        var i = 0;
        wordlist.each(function (d) {
            d3.select(this).transition()
                .duration(consts.FADE_TIME)
                .delay(ft*i)
                .style('background-color', colors.ring)
                .on('end', function() {
                    d3.select(this).transition()
                        .duration(consts.FADE_TIME)
                        .style('background-color', colors.bodyText)
                    ;
                })
            ;

            d3.select('#ring_' + d.word).transition()
                .duration(consts.FADE_TIME)
                .delay(ft*i)
                .style('background-color', colors.ring)
                .style('border-color', colors.ring)
                .on('start', function() {
                    d3.select(this).style('z-index', -1);
                })
                .on('end', function() {
                    d3.select(this).transition()
                        .duration(consts.FADE_TIME)
                        .style('background-color', colors.bodyText)
                        .style('border-color', colors.bodyText)
                        .on('end', function() {
                            d3.select(this).style('z-index', -2);
                        })
                    ;
                })
            ;

            i++;
        });
    }

    function cancelVictory() {
        d3.selectAll('.cell')
            .filter(function() { return d3.select(this).style('color') === colors.ring; })
            .style('color', colors.bodyText)
        ;
        wordlist.interrupt();
        d3.selectAll('.wfsolved')
            .style('background-color', colors.bodyText);
        d3.selectAll('.ring').interrupt();
        d3.selectAll('.ringsolved')
            .style('background-color', colors.bodyText)
            .style('border-color', colors.bodyText);
    }


    // ==================================================================

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

    function markAnswer(answer, t) {
        var marked = [];
        var params = util.sliceParams(puzzle.size, answer.direction, answer.slice);
        var dc = params[2];
        var dr = params[3];
        var c = params[0] + (answer.offset * dc);
        var r = params[1] + (answer.offset * dr);
        for (var i=0; i<answer.word.length; i++) {
            var cell = getCell(r + (dr*i), c + (dc*i));
            var d = d3.select('#' + cell.id());
            if (!d.empty() && d.classed('cellsolved') !== t) {
                d.classed('cellsolved', t);
            }
            marked.push(cell);
        }
        return marked;
    }

    function markWord(d, word, t, tween) {
        if (tween === undefined) {
            tween = consts.FADE_TIME;
        }
        if (!d) {
            d = d3.select('#wflist_'+word);
        }
        if (!d.empty() && d.classed('wfsolved')!==t) {
            var tt = util.calcTweenTime(tween);
            var bgc = colors.bodyBg, txc = colors.bodyText;
            if (t) {
                bgc = colors.bodyText;
                txc = colors.bodyBg;
            }
            d.classed('wfsolved', t);
            d.transition('wordmark')
                .duration(tt)
                .style('background-color', bgc)
                .style('color', txc)
            ;
        }
    }

    function checkWord(c, d, w) {
        for (var i=0; i<puzzle.answers.length; i++) {
            var a = puzzle.answers[i];
            var params = util.sliceParams(puzzle.size, a.direction, a.slice);
            var dc = params[2];
            var dr = params[3];
            var wsc = params[0] + (a.offset * dc);
            var wsr = params[1] + (a.offset * dr);
            var wec = wsc + ((a.word.length-1) * dc);
            var wer = wsr + ((a.word.length-1) * dr);
            //console.log(w, puzzle.answers[i].word, c.column, c.row, wsc, wsr, d.column, d.row, wec, wer);
            if (a.word === w && c.column === wsc && c.row === wsr && d.column === wec && d.row === wer) {
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
                marked = marked.concat(markAnswer(answer, true));
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

        wordlist.each(function (d) {
            markWord(d3.select(this), d.word, (awords.indexOf(d.word) !== -1));
        });

        if (answered === puzzle.answers.length) {
            doVictory();
        } else {
            cancelVictory();
        }

    }

    // ==================================================================

    function cancelDrag(tween) {
        if (dragRing) {
            var kill = function() {
                if (dragRing) {
                    dragRing.destroy();
                }
                dragRing = null;
            };
            if (tween) {
                dragRing.transitionOut(true, kill);
            } else {
                kill();
            }
        }
    }

    function createDrag(cell, tween) {
        dragRing = new viewring.Ring(cell);
        dragRing.ring = d3.select('#wffield').append('div').html('&nbsp;')
            .classed('ring', true)
            .classed('ringsolved', false)
        ;
        dragRing.resize(tween);
        if (tween) {
            dragRing.transitionIn(true, null);
        }
    }

    function continueDrag(newx, newy, transitt, transitcb) {
        // find angle from drag start to mouse
        var anchor = dragRing.getAnchor();
        var dy = newy - anchor.y;
        var dx = newx - anchor.x;
        var saa = util.snapAngle(dx, dy);
        var direction = saa[1];

        // Don't just cast a ray to find the end cell -- for diagonals, we'll
        // hit cells that are overlapping but off-line. Instead, walk along the
        // grid in the given direction until you've covered the distance.
        var dist2 = (dx*dx) + (dy*dy);
        var r = dragRing.startCell.row;
        var c = dragRing.startCell.column;
        // ummm, these are xy instead of rc
        var delta = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]][direction];
        var f, fdist2;
        do {
            f = getCell(r, c);
            var fp = f.getPagePosition();
            var sp = dragRing.startCell.getPagePosition();
            var fdx = fp.x - sp.x + (dragRing.size*delta[0]);
            var fdy = fp.y - sp.y + (dragRing.size*delta[1]);
            fdist2 = (fdx*fdx) + (fdy*fdy);
            r += delta[1];
            c += delta[0];
        } while (fdist2<dist2 && r>=0 && r<puzzle.size && c>=0 && c<puzzle.size);

        if (f && f !== dragRing.endCell) {
            dragRing.endCell = f;
            dragRing.word = wordBetweenCells(dragRing.startCell, dragRing.endCell);
            dragRing.resize(transitt, transitcb);
        }
    }

    function finishDrag(tween) {
        if (dragRing.word.length < 2) {
            cancelDrag(tween);
            return;
        }
        dragRing.ring.style('z-index', '-1');
        rings.push(dragRing);
        dragRing = null;
    }

    function onDragStartLetter(d) {
        if (inputDisabled) {
            return;
        }
        cancelDrag(true);
        createDrag(d, true);
    }

    function onDragMoveLetter() {
        if (inputDisabled) {
            return;
        }
        if (!dragRing) {
            return;
        }
        if (d3.event.sourceEvent.type === 'touchmove') {
            if (d3.event.sourceEvent.touches.length > 0) {
                continueDrag(d3.event.sourceEvent.touches.item(0).clientX, d3.event.sourceEvent.touches.item(0).clientY, true);
            }
        } else {
            continueDrag(d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY, true);
        }
    }

    function onDragEndLetter() {
        if (inputDisabled) {
            return;
        }
        if (!dragRing) {
            return;
        }
        finishDrag(true);
        checkAnswers();
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

    function autosolve() {
        disableInput();
        var fanswer = function(i) {
            if (i >= puzzle.answers.length) {
                enableInput();
                return;
            }
            var answer = puzzle.answers[i];
            var params = util.sliceParams(puzzle.size, answer.direction, answer.slice);
            var dc = params[2], dr = params[3];
            var c = params[0] + (answer.offset * dc);
            var r = params[1] + (answer.offset * dr);
            var ec = c + ((answer.word.length-1) * dc);
            var er = r + ((answer.word.length-1) * dr);
            var startCell = getCell(r, c);
            createDrag(startCell, false);

            var fcell = function() {
                if (r === er && c === ec) {
                    return;
                }
                r += dr;
                c += dc;
                var cell = getCell(r,c);
                var cp = cell.getPagePosition();
                var transitcb = (r!==er || c!==ec) ? fcell : function() {
                    finishDrag(false);
                    checkAnswers();
                    fanswer(i+1);
                };
                continueDrag(cp.x+dragRing.size, cp.y+dragRing.size, consts.TWEEN_TIME, transitcb);
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
        puzzle = puz;
        d3.select('#message').text('');
        d3.selectAll('#wfgrid tr').remove();
        d3.selectAll('#wflist li').remove();
        var body = d3.select('body');

        // Create dummy elements to get CSS derived metrics
        {
            var szdummy = body.append('td').classed('cell', true);
            var cw = parseInt(szdummy.style('width'), 10) * puzzle.size;
            d3.select('#wfgrid')
                .style('width', cw + 'px')
                .style('min-width', cw + 'px');
            d3.select('#help').style('width', cw + 'px');
            szdummy.remove();

            szdummy = body.append('div').classed('ring', true);
            viewring.Ring.prototype.borderSize = parseInt(szdummy.style('border-top-width'), 10);
            viewring.Ring.prototype.size = parseInt(szdummy.style('width'), 10);
            viewring.Ring.prototype.solvedColor = szdummy.style('color');
            viewring.Ring.prototype.bgColor = szdummy.style('background-color');
            viewring.Ring.prototype.borderColor = szdummy.style('border-top-color');
            colors.ring = szdummy.style('border-top-color');
            szdummy.remove();

            szdummy = body.append('div').classed('wfword', true);
            colors.bodyBg = szdummy.style('background-color');
            colors.bodyText = szdummy.style('color');
            szdummy.remove();
        }


        // build the grid
        {
            var rows = body.select('#wfgrid tbody').selectAll('tr')
                .data(puzzle.grid.grid)
                .enter()
                .append('tr')
            ;

            var r = 0;
            cells = rows.selectAll('td')
                .data(function(row) {
                    var c = 0;
                    var rv = row.map(function(s) {
                        return new viewcell.Cell(s, r, c++);
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
        }

        recordCellSizes();

        // build the word list
        {
            var ul = body.select('#wflist');
            wordlist = ul.selectAll('li')
                .data(puzzle.answers)
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
                checkAnswers();
            });
            body.select('#tbClear').on('click', function() {
                cancelDrag(true);
                clearRings(true);
                checkAnswers();
            });
            body.select('#tbNew').on('click', function() {
                cancelDrag(false);
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
                    .text('Cheat')
                    .on('click', function() {
                        cancelDrag(true);
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

        if (puzzle.seed) {
            var u = '?p=' + puzzle.serialize();
            d3.select('#permalink').html('').append('a')
                .attr('href', u)
                .text('permalink');
        } else {
            d3.select('#permalink').html('');
        }

        enableInput();
    }

    // ==================================================================

    module.exports = {
        displayPuzzle: displayPuzzle,
        messageArea: d3.select('#message'),
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
