(function() {
    'use strict';

    var url = require('url');
    var cookies = require('browser-cookies');
    var util = require('./util');
    var data = require('./model/data');
    var puzzle = require('./model/puzzle');
    var view = require('./view/view');

    function puzzleForWords(size, seed, words) {
        var p;
        try {
            p = puzzle.makeFromWords(size, seed, words);
        } catch (e) {
            if (e instanceof puzzle.PuzzleConflictError) {
                util.log(e.message);
                view.msgClear();
                view.msgFailure('I couldn\'t fit these words into a puzzle. Maybe change the words (fewer words, shorter words, etc.), or choose a larger grid size.');
            }
            throw e;
        }
        return p;
    }

    function wordfindatronMain(q) {
        view.disableInput();
        view.msgClear();
        view.msgWrite('Thinking&hellip;');
        var p;

        try {
            if (q && q.p) {
                p = puzzle.makeFromSerialized(q.p);
            } else {
                p = puzzle.makeFromParameters(view.getGridSize(), view.getDensity());
            }
        } catch (e) {
            if (e instanceof puzzle.PuzzleConflictError) {
                util.log(e.message);
                view.msgClear();
                view.msgFailure('Problem creating a puzzle: ['+e.message+']');
            }
            throw e;
        }

        if (p) {
            view.displayPuzzle(p, wordfindatronMain, puzzleForWords);
        } else {
            view.msgClear();
            view.msgFailure('Couldn\'t create a puzzle?!');
        }
    }

    var gs = cookies.get('wordfindatron.gridsize');
    if (gs) {
        view.writeGridSize(parseInt(gs, 10));
    }
    var de = cookies.get('wordfindatron.density');
    if (de) {
        view.writeDensity(parseFloat(de));
    }

    view.msgClear();
    view.msgWrite('Loading&hellip;');
    data.load(view, function() {
        var query = url.parse(window.location.href, true).query;
        wordfindatronMain(query);
    });

}());
