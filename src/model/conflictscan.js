(function () {
    'use strict';

    var Random = require('random-js');
    var consts = require('../consts');
    var util = require('../util');
    var data = require('./data');
    var grid = require('./grid');

    // ==================================================================

    function PuzzleConflictError(di, si, of, wl, word) {
        if (typeof di === 'string') {
            this.message = di;
        } else {
            this.message = 'Failed to fix conflict at ['+di+']['+si+']['+of+']['+wl+'] ['+word+']';
        }
    }
    PuzzleConflictError.prototype = Object.create(Error.prototype);
    PuzzleConflictError.prototype.name = 'PuzzleConflictError';
    PuzzleConflictError.prototype.constructor = PuzzleConflictError;

    var blacklist, scanPuzzle;

    // ==================================================================

    function fix(di, si, of, wl) {
        var agrid = scanPuzzle.answerGrid();
        var suspect = scanPuzzle.grid.readWord(di, si, of, wl);
        // if we've been fixing intersecting bad words, this might already
        // be okay, so double check.
        if (scanPuzzle.words.indexOf(suspect)===-1 && util.bIndexOf(blacklist, suspect)===-1) {
            return true;
        }

        var changed = false;
        var sp = grid.sliceParams(scanPuzzle.size, di, si);
        var dx = sp[2];
        var dy = sp[3];
        var x = sp[0] + (of * dx);
        var y = sp[1] + (of * dy);
        for (var i=0; i<wl; i++) {
            // don't change a letter that belongs to an answer.
            if (agrid.get(x, y) === ' ') {
                var ch = Random.pick(scanPuzzle.rng, consts.ALPHABET);
                scanPuzzle.grid.set(x, y, ch);
                changed = true;
            }
            x += dx;
            y += dy;
        }
        //var newWord = scanPuzzle.grid.readWord(di, si, of, wl);
        //util.log('fix', suspect, newWord, changed);
        return changed;
    }

    function check(cut, di, sl, of, wl) {
        var w = cut.substring(of, of+wl);
        if (scanPuzzle.words.indexOf(w)!==-1 && !scanPuzzle.isAnswer(w, di, sl, of, wl)) {
            //util.log('dup', di, sl, of, wl, w);
            return true;
        }
        if (util.bIndexOf(blacklist, w) !== -1) {
            //util.log('blk', di, sl, of, wl, w);
            return true;
        }
        return false;
    }

    function scan(puz) {
        blacklist = data.getBlacklist();
        scanPuzzle = puz;
        var hits = [];

        for (var direction=0; direction<8; direction++) {
            var nslices = scanPuzzle.size;
            if (direction%2 === 1) {
                nslices = (scanPuzzle.size * 2) - 1;
            }
            for (var slice=0; slice<nslices; slice++) {
                var cut = scanPuzzle.grid.cutSlice(direction, slice);
                for (var offset=0; offset<cut.length; offset++) {
                    for (var wlen=1; wlen<cut.length-offset+1; wlen++) {
                        var hit = check(cut, direction, slice, offset, wlen);
                        if (hit) {
                            hits.push([direction, slice, offset, wlen]);
                        }
                    }
                }
            }
        }

        for (var hi=0; hi<hits.length; hi++) {
            var h = hits[hi];
            var fixed = fix(h[0], h[1], h[2], h[3]);
            if (!fixed) {
                var m = 'Failed to fix conflict at [' +
                    h[0] + '][' + h[1] + '][' + h[2] + '][' + h[3] + ']';
                    //+ ' [' + scanPuzzle.grid.readWord(h[0], h[1], h[2], h[3]) + ']';
                throw new PuzzleConflictError(m);
            }
        }
        return hits;
    }

    // ==================================================================

    module.exports = {
        scan: scan,
        PuzzleConflictError: PuzzleConflictError
    };

}());
