const data = require('./data');
const view = require('./view');
const puzzle = require('./puzzle');
data.load(view, function() {
    var doit = function() {
        var p = puzzle.makePuzzle(view.getGridSize(), view.getNumWords());
        //console.log(p[1].toString());
        view.displayPuzzle(p, function() {
            doit();
        });
    };
    doit();
});
