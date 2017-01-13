(function () {
'use strict';
var data = require('./data');
var view = require('./view');
var puzzle = require('./puzzle');
data.load(view, function() {
    var doit = function() {
        view.disableInput();
        var p = puzzle.makePuzzle(view.getGridSize(), view.getNumWords());
        view.displayPuzzle(p, function() {
            doit();
        });
    };
    doit();
});
}());
