const consts = require('./consts');
const util = require('./util');
const d3 = require('d3');

function cid(r, c) {
    return 'c'+r+'_'+c;
}

function Cell(s, r, c) {
    this.state = 0; // 0=clear, 1=selected, 2=solved
    this.letter = s;
    this.row = r;
    this.column = c;
    this.id = function() {
        return cid(this.row, this.column);
    };
}

function getGridSize() {
    var d = d3.select('#tbSize');
    var rv = parseInt(d.property('value'));
    return rv;
}

function getNumWords() {
    var d = d3.select('#tbWords');
    var rv = parseInt(d.property('value'));
    return rv;
}

function displayPuzzle(puzzle, cbNewPuzzle) {
    var answers = puzzle[0], grid = puzzle[2];
    d3.select('#message').text('');
    d3.selectAll('#wfgrid tr').remove();
    d3.selectAll('#wflist li').remove();
    var body = d3.select('body');

    var onClickLetter = function(d) {
        // toggle this cell.
        d.state = (d.state === 0)?1:0;

        // reset all other cells' solution states.
        cells.each(function (d) { if (d.state > 1) d.state = 1; });
        words.classed('wfsolved', false);

        // check to see which words have been solved by scanning through the
        // table and checking cell state.
        for (var i=0; i<answers.length; i++) {
            var answer = answers[i];
            var a = util.sliceParams(grid.size, answer.direction, answer.slice);
            var dx = a[2], dy = a[3];
            var x = a[0] + dx * answer.offset;
            var y = a[1] + dy * answer.offset;
            var cell;
            for (var j=0; j<answer.word.length; j++,x+=dx,y+=dy) {
                cell = d3.select('#'+cid(y,x)).data()[0];
                if (cell.state === 0)
                    break;
            }

            // if the word has been solved, go through again and mark the cells.
            if (j == answer.word.length) {
                x = a[0] + dx * answer.offset;
                y = a[1] + dy * answer.offset;
                for (j=0; j<answer.word.length; j++,x+=dx,y+=dy) {
                    cell = d3.select('#'+cid(y,x)).data()[0];
                    cell.state = 2;
                }
                d3.select('#wflist_' + answer.word).classed('wfsolved', true);
            }
        }
        refreshGrid();
    };

    var refreshGrid = function() {
        d3.selectAll('.cell')
            .classed('cell0', function(d) { return (d.state === 0); })
            .classed('cell1', function(d) { return (d.state == 1); })
            .classed('cell2', function(d) { return (d.state == 2); })
        ;
    };

    var tbody = body.select('#wfgrid tbody');
    var rows = tbody.selectAll('tr')
        .data(grid.grid)
        .enter()
        .append('tr')
    ;
    var r = 0;
    var cells = rows.selectAll('td')
        .data(function(row) {
            var c = 0;
            rv = row.map(function(s) {
                return new Cell(s, r, c++);
            });
            r++;
            return rv;
        })
        .enter()
        .append('td')
        .attr('id', function(d) { return d.id(); })
        .classed('cell', true)
        .classed('cell0', true)
        .classed('cell1', false)
        .classed('cell2', false)
        .on('click', onClickLetter)
        .append('div')
        .classed('gc', true)
        .text(function(d) { return d.letter; })
    ;

    // word list
    var ul = body.select('#wflist');
    var words = ul.selectAll('li')
        .data(answers)
        .enter()
        .append('li')
        .attr('id', function(d) { return 'wflist_' + d.word; })
        .classed('wflistword', true)
        .classed('wfsolved', false)
        .text(function(d) { return d.word; })
    ;

    // toolbar
    body.select('#tbClear')
        .on('click', function(d) {
            cells.each(function(d) { d.state = 0; });
            words.classed('wfsolved', false);
            refreshGrid();
        })
    ;
    body.select('#tbNew')
        .on('click', function(d) {
            cbNewPuzzle(getGridSize(), getNumWords());
        })
    ;

}

module.exports = {
    displayPuzzle:displayPuzzle,
    messageArea:d3.select('#message'),
    getGridSize:getGridSize,
    getNumWords:getNumWords,
};

