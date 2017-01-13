(function () {
'use strict';
var url = require('url');
var data = require('./data');
var view = require('./view');
var puzzle = require('./puzzle');


data.load(view, function() {
    var q = url.parse(window.location.href, true).query;
    var doit = function(q) {
        view.disableInput();
        var p;
        if (q && q.p) {
            p = puzzle.deserialize(q.p);
        } else if (q && q.size && q.words && q.seed) {
            view.writeGridSize(q.size);
            view.writeNumWords(q.words);
            view.writeSeed(q.seed);
            p = puzzle.makePuzzle(parseInt(q.size, 10), parseInt(q.words, 10), parseInt(q.seed, 10));
        } else {
            p = puzzle.makePuzzle(view.getGridSize(), view.getNumWords(), view.getSeed());
        }

        view.displayPuzzle(p, function() {
            doit();
        });
    };
    doit(q);
});
}());
