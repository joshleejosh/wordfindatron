const data = require('./data');
const view = require('./view');
const puzzle = require('./puzzle');
data.load(view, function() {
    var doit = function() {
        var p = puzzle.makePuzzle(8);
        view.displayPuzzle(p, function() {
            doit();
        });
    }
    doit();
})
