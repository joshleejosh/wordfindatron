var data = require('./data');
var view = require('./view');
var puzzle = require('./puzzle');
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
