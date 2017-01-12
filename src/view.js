(function () {
'use strict';


var d3 = require('d3');
var util = require('./util');
var viewcell = require('./viewcell');
var viewring = require('./viewring');

var cells, words;
var answers, theGrid;
var rings = [];
var dragRing;
var inputDisabled = false;

// ==================================================================

function getGridSize() {
    var d = d3.select('#tbSize');
    var rv = parseInt(d.property('value'), 10);
    return rv;
}

function getNumWords() {
    var d = d3.select('#tbWords');
    var rv = parseInt(d.property('value'), 10);
    return rv;
}

function wordBetweenCells(c, d) {
    if (c.row===d.row && c.column===d.column) {
        return c.letter;
    }
    var parms = theGrid.coordsToSlice(c.column, c.row, d.column, d.row);
    var word = theGrid.readWord(parms[0], parms[1], parms[2], parms[3]);
    return word;
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

function popRing() {
    if (rings.length === 0) {
        return;
    }
    rings[rings.length-1].destroy();
    rings.pop();
}

function clearRings() {
    while (rings.length > 0) {
        popRing();
    }
}

function markRing(ring, t) {
    if (t) {
        ring.ring.classed('ringoff', false);
        ring.ring.classed('ringon', true);
    } else {
        ring.ring.classed('ringoff', true);
        ring.ring.classed('ringon', false);
    }
}

function markAnswer(answer, t) {
    var params = util.sliceParams(theGrid.size, answer.direction, answer.slice);
    var dc = params[2];
    var dr = params[3];
    var c = params[0] + answer.offset * dc;
    var r = params[1] + answer.offset * dr;
    for (var i=0; i<answer.word.length; i++) {
        var cell = getCell(r + dr*i, c + dc*i);
        d3.select('#' + cell.id()).classed('cellsolved', t);
    }
}

function markWord(word, t) {
    var e = d3.select('#wflist_'+word);
    if (!e.empty()) {
        e.classed('wfsolved', t);
    }
}

function checkWord(c, d, w) {
    for (var i=0; i<answers.length; i++) {
        var a = answers[i];
        var params = util.sliceParams(theGrid.size, a.direction, a.slice);
        var dc = params[2];
        var dr = params[3];
        var wsc = params[0] + a.offset * dc;
        var wsr = params[1] + a.offset * dr;
        var wec = wsc + (a.word.length-1) * dc;
        var wer = wsr + (a.word.length-1) * dr;
        //console.log(w, answers[i].word, c.column, c.row, wsc, wsr, d.column, d.row, wec, wer);
        if (a.word === w && c.column === wsc && c.row === wsr && d.column === wec && d.row === wer) {
            return a;
        }
    }
    return null;
}

function checkRings() {
    cells.classed('cellsolved', false);
    words.classed('wfsolved', false);
    var answered = 0;
    for (var i=0; i<rings.length; i++) {
        var answer = checkWord(rings[i].startCell, rings[i].endCell, rings[i].word);
        if (answer) {
            markRing(rings[i], true);
            markAnswer(answer, true);
            markWord(rings[i].word, true);
            answered++;
        } else {
            var revword = rings[i].word.split('').reverse().join(''); // FIXME: will break on unicode
            answer = checkWord(rings[i].endCell, rings[i].startCell, revword);
            if (answer) {
                markRing(rings[i], true);
                markAnswer(answer, true);
                markWord(revword, true);
            } else {
                markRing(rings[i], false);
            }
        }
    }

    if (answered === answers.length) {
        console.log("yay!");
    }
}

function redrawRings() {
    for (var i=0; i<rings.length; i++) {
        rings[i].calculateMetrics();
        rings[i].resize(false);
    }
}


// ==================================================================

function cancelDrag(transit) {
    if (dragRing) {
        var kill = function() {
            if (dragRing) {
                dragRing.destroy();
            }
            dragRing = null;
        };
        if (transit) {
            dragRing.transitionOut(true, kill);
        } else {
            kill();
        }
    }
}

function createDrag(cell, transit) {
    dragRing = new viewring.Ring(cell);
    dragRing.ring = d3.select('#wffield').append('div').html('&nbsp;')
        .classed('ring', true)
        .classed('ringoff', true)
    ;
    dragRing.resize(transit);
    //var haf = dragRing.ring.size/2 + dragRing.borderSize;
    //dragRing.ring.style('transform-origin', ''+haf+'px '+haf+'px');
    if (transit) {
        dragRing.transitionIn(true, null);
    }
}

function continueDrag(newx, newy, transitt, transitcb) {
    // find angle from drag start to mouse
    var dy = newy - dragRing.cy;
    var dx = newx - dragRing.cx;
    var saa = util.snapAngle(dx, dy);
    var direction = saa[1];

    // Don't just cast a ray to find the end cell -- for diagonals, we'll
    // hit cells that are overlapping but off-line. Instead, walk along the
    // grid in the given direction until you've covered the distance.
    var dist2 = (dx*dx) + (dy*dy);
    var r = dragRing.startCell.row;
    var c = dragRing.startCell.column;
    var delta = [ [1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1] ][direction]; // uh, these are xy instead of rc
    do {
        var f = getCell(r, c);
        var fp = f.getPagePosition();
        var sp = dragRing.startCell.getPagePosition();
        var fdx = fp.x - sp.x + dragRing.size*delta[0];
        var fdy = fp.y - sp.y + dragRing.size*delta[1];
        var fdist2 = (fdx*fdx) + (fdy*fdy);
        r += delta[1];
        c += delta[0];
    } while (fdist2<dist2 && r>=0 && r<theGrid.size && c>=0 && c<theGrid.size);

    if (f) {
        dragRing.endCell = f;
        dragRing.word = wordBetweenCells(dragRing.startCell, dragRing.endCell);
        dragRing.resize(transitt, transitcb);
    }
}

function finishDrag(transit) {
    if (dragRing.word.length < 2) {
        cancelDrag(transit);
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
    checkRings();
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
    var _fanswer = function(i) {
        if (i >= answers.length) {
            enableInput();
            return;
        }
        var answer = answers[i];
        var params = util.sliceParams(theGrid.size, answer.direction, answer.slice);
        var dc = params[2], dr = params[3];
        var c = params[0] + answer.offset * dc;
        var r = params[1] + answer.offset * dr;
        var ec = c + (answer.word.length-1) * dc;
        var er = r + (answer.word.length-1) * dr;
        var startCell = getCell(r, c);
        createDrag(startCell, false);

        var _fcell = function() {
            if (r === er && c === ec) {
                return;
            }
            r += dr;
            c += dc;
            var cell = getCell(r,c);
            var cp = cell.getPagePosition();
            var transitcb = (r!==er || c!==ec) ? _fcell : function() {
                finishDrag(false);
                checkRings();
                _fanswer(i+1);
            };
            continueDrag(cp.x+dragRing.size, cp.y+dragRing.size, true, transitcb);
        };
        _fcell();
    };
    _fanswer(0);
    // god I hope tail-call is working here.
}

function displayPuzzle(puzzle, cbNewPuzzle) {
    answers = puzzle[0];
    theGrid = puzzle[2];
    d3.select('#message').text('');
    d3.selectAll('#wfgrid tr').remove();
    d3.selectAll('#wflist li').remove();
    var body = d3.select('body');

    // Create dummy elements to get CSS derived metrics.
    {
        var szdummy = body.append('td').classed('cell', true);
        var cw = parseInt(szdummy.style('width'), 10) * theGrid.size;
        d3.select('#wfgrid')
            .style('width', cw + 'px')
            .style('min-width', cw + 'px');
        szdummy.remove();

        szdummy = body.append('div').classed('ring', true);
        viewring.Ring.prototype.borderSize = parseInt(szdummy.style('border-width'), 10);
        viewring.Ring.prototype.size = parseInt(szdummy.style('width'), 10);
        szdummy.remove();
    }

    // create the grid.
    {
        var rows = body.select('#wfgrid tbody').selectAll('tr')
            .data(theGrid.grid)
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
    d3.select(window).on('resize', function() {
        cancelDrag(false);
        recordCellSizes();
        redrawRings();
    });

    // word list
    {
        var ul = body.select('#wflist');
        words = ul.selectAll('li')
            .data(answers)
            .enter()
            .append('li')
            .attr('id', function(d) { return 'wflist_' + d.word; })
            .classed('wfword', true)
            .classed('wfsolved', false)
            .text(function(d) { return d.word; })
        ;
    }

    // toolbar
    {
        body.select('#tbUndo')
            .on('click', function() {
                popRing();
                checkRings();
            })
        ;
        body.select('#tbClear')
            .on('click', function() {
                cancelDrag(true);
                clearRings();
                checkRings();
            })
        ;
        body.select('#tbSolve')
            .on('click', function() {
                cancelDrag(true);
                clearRings();
                checkRings();
                autosolve();
            })
        ;
        body.select('#tbNew')
            .on('click', function() {
                cancelDrag(false);
                clearRings();
                cbNewPuzzle(getGridSize(), getNumWords());
                checkRings();
            })
        ;
    }

    enableInput();
    msgClear();
    msgWrite(navigator.appName, navigator.platform);
    msgWrite(navigator.userAgent);
    console.log(navigator);
}

// ==================================================================

module.exports = {
    displayPuzzle:displayPuzzle,
    messageArea:d3.select('#message'),
    getGridSize:getGridSize,
    getNumWords:getNumWords,
    disableInput:disableInput,
    enableInput:enableInput
};

}());
