(function() {
    'use strict';

    var url = require('url');
    var data = require('./data');
    var view = require('./view');
    var puzzle = require('./puzzle');


    data.load(view, function() {
        var query = url.parse(window.location.href, true).query;
        var doit = function(q) {
            view.disableInput();
            var p;
            if (q && q.p) {
                p = puzzle.deserialize(q.p);
            } else if (q && q.h) {
                p = puzzle.fromParameters(q.h);
            } else {
                p = new puzzle.Puzzle(view.getGridSize(), view.getSeed());
                p.generate(view.getNumWords());
            }

            view.displayPuzzle(p, function() {
                doit();
            });
        };
        doit(query);
    });
}());
