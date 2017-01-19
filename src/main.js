(function() {
    'use strict';

    var url = require('url');
    var consts = require('./consts');
    var util = require('./util');
    var data = require('./model/data');
    var puzzle = require('./model/puzzle');
    var view = require('./view/view');

    // Keep trying to generate the puzzle until either it succeeds or we exceed the retry limit.
    function doGeneration(fgen, ferr, caller) {
        for (var retries=0; retries<consts.MAX_CONFLICT_RETRIES; retries++) {
            try {
                return fgen();
            } catch (e) {
                if (e instanceof puzzle.PuzzleConflictError) {
                    util.log(e.message);
                    if (ferr) {
                        ferr();
                    }
                } else {
                    throw e;
                }
            }
        }
        throw new puzzle.PuzzleConflictError(caller+': too many retries');
    }

    function puzzleForWords(size, seed, words) {
        try {
            var p;
            doGeneration(
                function() {
                    p = new puzzle.Puzzle(size, seed, words);
                    p.generate(words.length);
                },
                null,
                'puzzleForWords'
            );
            return p;
        } catch (e) {
            if (e instanceof puzzle.PuzzleConflictError) {
                util.log(e.message);
                view.msgClear();
                view.msgFailure('I couldn\'t fit these words into a puzzle. Maybe change the words (fewer words, shorter words, etc.), or choose a larger grid size.');
            } else {
                throw e;
            }
        }
        return null;
    }

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
                doGeneration(
                    function() {
                        return p.generate(view.getNumWords());
                    },
                    function() {
                        p.reset(new Date().getTime());
                    },
                    'wordfindatronMain');
            }
        } catch (e) {
            util.log(e.message);
            view.msgClear();
            view.msgWrite(e.message);
            p = null;
            throw e;
        }

        if (p) {
            view.displayPuzzle(p, wordfindatronMain, puzzleForWords);
        }
    }

    data.load(view, function() {
        var query = url.parse(window.location.href, true).query;
        wordfindatronMain(query);
    });
}());
