(function() {
    'use strict';

    var url = require('url');
    var util = require('./util');
    var data = require('./model/data');
    var puzzle = require('./model/puzzle');
    var view = require('./view/view');

    function wordfindatronMain(q) {
        view.disableInput();
        view.msgClear();
        view.msgWrite('Loading...');
        var p;

        try {
            if (q && q.p) {
                p = puzzle.deserialize(q.p);
            } else {
                p = new puzzle.Puzzle(view.getGridSize(), view.getSeed());
                p.generate(view.getNumWords());
            }
        } catch (e) {
            util.log(e.message);
            view.msgClear();
            view.msgWrite(e.message);
            p = null;
            throw e;
        }

        if (p) {
            view.displayPuzzle(p, function() {
                wordfindatronMain();
            });
        }
    }

    data.load(view, function() {
        var query = url.parse(window.location.href, true).query;
        wordfindatronMain(query);
    });
}());
