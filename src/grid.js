(function() {
    'use strict';

    var consts = require('./consts');
    var util = require('./util');

    // ==================================================================

    /* I represent a word placed on a Grid. */
    var GridWord = function(w, d, s, o) {
        this.word = w;
        this.direction = d;
        this.slice = s;
        this.offset = o;
    };

    // ==================================================================

    /*
     * I represent a grid of letters used in a word puzzle.
     * I can be _sliced_ in any of 8 directions.
     *
     */
    var Grid = function(size) {
        this.grid = [];
        this.size = size;
        for (var gr=0; gr<this.size; gr++) {
            var row = [];
            for (var gc=0; gc<this.size; gc++) {
                row.push(' ');
            }
            this.grid.push(row);
        }
    };

    /*
     * Fill in this grid from the given string.
     */
    Grid.prototype.fromString = function(s) {
        for (var r=0,i=0; r<this.size && i<s.length; r++) {
            for (var c=0; c<this.size && i<s.length; c++) {
                this.grid[r][c] = s[i];
                i++;
            }
        }
        return this;
    };

    /*
     * Return the grid as a string, formatted into rows.
     */
    Grid.prototype.toString = function() {
        var rv = '';
        for (var r=0; r<this.size; r++) {
            for (var c=0; c<this.size; c++) {
                rv += this.grid[r][c];
            }
            rv += '\n';
        }
        return rv;
    };

    /*
     * Make a copy of this grid.
     */
    Grid.prototype.copy = function() {
        var rv = new Grid(this.size);
        for (var r=0; r<this.size; r++) {
            for (var c=0; c<this.size; c++) {
                rv.grid[r][c] = this.grid[r][c];
            }
        }
        return rv;
    };

    /*
     * Return a string containing the characters pulled
     * out of the grid along the given slice.
     */
    Grid.prototype.cutSlice = function(di, si) {
        var a = util.sliceParams(this.size, di, si);
        var x = a[0], y = a[1], dx = a[2], dy = a[3];
        var cut = '';
        while (0 <= x && x < this.size && 0 <= y && y < this.size) {
            cut += this.grid[y][x];
            x += dx;
            y += dy;
        }
        return cut;
    };

    /*
     * Write the given word into this grid along the given slice and offset.
     */
    Grid.prototype.placeWord = function(di, si, offset, word) {
        if (di instanceof GridWord) {
            var gw = di;
            di = gw.direction;
            si = gw.slice;
            offset = gw.offset;
            word = gw.word;
        }

        var a = util.sliceParams(this.size, di, si);
        var x = a[0], y = a[1], dx = a[2], dy = a[3];
        x += dx * offset;
        y += dy * offset;
        for (var i=0; i<word.length && x>=0 && x<this.size && y>=0 && y<this.size; i++) {
            var ch = word[i];
            // if it's a unicode surrogate pair, grab the second character.
            if (/[\uD800-\uDFFF]/.test(ch)) {
                i++;
                ch += word[i];
            }
            this.grid[y][x] = ch;
            x += dx;
            y += dy;
        }
    };

    /*
     * Read and return the word along the given slice.
     */
    Grid.prototype.readWord = function(di, si, offset, wlen) {
        var rv = '';
        var a = util.sliceParams(this.size, di, si);
        var x = a[0], y = a[1], dx = a[2], dy = a[3];
        x += dx * offset;
        y += dy * offset;
        for (var i=0; i<wlen && x>=0 && x<this.size && y>=0 && y<this.size; i++) {
            var ch = this.grid[y][x];
            rv += ch;
            x += dx;
            y += dy;
        }
        return rv;
    };

    Grid.prototype.offsetOnSlice = function(di, si, x, y) {
        var mg = this.size - 1;
        return [
            x,
            (si < this.size) ? x : y,
            y,
            (si < this.size) ? y : (mg - x),
            this.size - x - 1,
            (si < this.size) ? (mg - y) : (mg - x),
            this.size - y - 1,
            (si < this.size) ? x : (mg - y)
        ][di];
    };

    /*
     * Given two sets of grid coordinates, return slice parameters.
     * raise RangeError if the two points aren't colinear. (coslicear?)
     */
    Grid.prototype.coordsToSlice = function(x0, y0, x1, y1) {
        var dy = y1 - y0;
        var dx = x1 - x0;
        //console.log(x0, y0, x1, y1, dy, dx);
        if ((dy===0 && dx===0) || (dy!==0 && dx!==0 && Math.abs(dy)!==Math.abs(dx))) {
            throw new RangeError('Grid.coordsToSlice: ['+x0+','+y0+'] ['+x1+','+y1+'] => bad delta ['+dx+','+dy+']');
        }

        var mg = this.size - 1;
        var direction = [
            [5,  4, 3],
            [6, -1, 2],
            [7,  0, 1]
        ][util.sign(dx)+1][util.sign(dy)+1];
        var slice = [
            y0,
            (x0 - y0) + mg,
            x0,
            x0 + y0,
            y0,
            (x0 - y0) + mg,
            x0,
            x0 + y0
        ][direction];

        var offset = this.offsetOnSlice(direction, slice, x0, y0);
        var offset1 = this.offsetOnSlice(direction, slice, x1, y1);
        var length = Math.abs(offset1 - offset) + 1;
        return [direction, slice, offset, length];
    };

    /*
     * Fill all blanks with junk.
     */
    Grid.prototype.fillJunk = function(frnd) {
        for (var r=0; r<this.size; r++) {
            for (var c=0; c<this.size; c++) {
                if (this.grid[r][c] === ' ') {
                    this.grid[r][c] = frnd(consts.ALPHABET);
                }
            }
        }
    };

    // ==================================================================

    module.exports = {
        Grid: Grid,
        GridWord: GridWord
    };
}());
