(function() {
    'use strict';

    var util = require('../util');

    // ==================================================================

    /*
     * Return tuple (x, y, dx, dy), where x,y is the starting location for the
     * slice on the grid and dx,dy is the increment to walk through the slice.
     *
     * direction … slice 0 starting point (G = grid size - 1)
     * 0 → E       top-left (0,0)
     * 1 ↘ SE      bottom-left (0,G)
     * 2 ↓ S       top-left  (0,0)
     * 3 ↙ SW      top-left (0,0)
     * 4 ← W       top-right (G,0)
     * 5 ↖ NW       bottom-left (0,G)
     * 6 ↑ N       bottom-left (0,G)
     * 7 ↗ NE      top-left (0,0)
     */
    function sliceParams (sz, di, si) {
        var mg = sz - 1;
        if ((sz <= 0) || (si < 0) || (di%2 === 0 && si > mg) || (di%2 === 1 && si > ((sz*2)-2))) {
            throw RangeError('sliceParams: slice '+si+' out of range for grid size '+sz+'');
        }
        return [[0                       , si                      ,  1,  0],
                [Math.max(0, si-mg)      , Math.max(0, mg-si)      ,  1,  1],
                [si                      , 0                       ,  0,  1],
                [Math.min(mg, mg-(mg-si)), Math.max(0, si-mg)      , -1,  1],
                [mg                      , si                      , -1,  0],
                [Math.min(mg, mg-(mg-si)), Math.min(mg, mg-(si-mg)), -1, -1],
                [si                      , mg                      ,  0, -1],
                [Math.max(0, si-mg)      , Math.min(mg, mg-(mg-si)),  1, -1]
        ][di];
    }

    // ==================================================================

    /* I represent a word placed on a Grid. */
    var GridWord = function(gridSize, w, d, s, o) {
        this.direction = d;
        this.slice = s;
        this.offset = o;
        this.word = w;

        var params = sliceParams(gridSize, this.direction, this.slice);
        var dx = params[2];
        var dy = params[3];
        this.startLocation = {
            x: params[0] + (this.offset * dx),
            y: params[1] + (this.offset * dy)
        };
        this.endLocation = {
            x: this.startLocation.x + ((this.word.length - 1) * dx),
            y: this.startLocation.y + ((this.word.length - 1) * dy)
        };
        return this;
    };

    /*
     * Return an array of x/y objects representing the
     * coordinates of each letter in this GridWord.
     */
    GridWord.prototype.getCellCoordinates = function() {
        var rv = [];
        var sx = this.startLocation.x;
        var sy = this.startLocation.y;
        var ex = this.endLocation.x;
        var ey = this.endLocation.y;
        var dx = util.sign(ex - sx);
        var dy = util.sign(ey - sy);
        var x = sx, y = sy;
        while (x!==ex || y!==ey) {
            rv.push({x: x, y: y});
            x += dx;
            y += dy;
        }
        rv.push({x: x, y: y});
        return rv;
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
        return this;
    };

    Grid.prototype.get = function(x, y) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            throw new RangeError('['+x+']['+y+']');
        }
        return this.grid[y][x];
    };

    Grid.prototype.set = function(x, y, v) {
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
            throw new RangeError('['+x+']['+y+']');
        }
        this.grid[y][x] = v;
    };

    Grid.prototype.reset = function() {
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                this.grid[y][x] = ' ';
            }
        }
    };

    /*
     * Fill in this grid from the given string.
     */
    Grid.prototype.fromString = function(s) {
        for (var y=0,i=0; y<this.size && i<s.length; y++) {
            for (var x=0; x<this.size && i<s.length; x++) {
                this.set(x, y, s[i]);
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
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                rv += this.get(x, y);
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
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                rv.set(x, y, this.get(x, y));
            }
        }
        return rv;
    };

    /*
     * Return a string containing the characters pulled
     * out of the grid along the given slice.
     */
    Grid.prototype.cutSlice = function(di, si) {
        var a = sliceParams(this.size, di, si);
        var x = a[0], y = a[1], dx = a[2], dy = a[3];
        var cut = '';
        while (0 <= x && x < this.size && 0 <= y && y < this.size) {
            cut += this.get(x, y);
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

        var a = sliceParams(this.size, di, si);
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
        var a = sliceParams(this.size, di, si);
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
     * throw RangeError if the two points aren't colinear. (coslicear?)
     */
    Grid.prototype.coordsToSlice = function(x0, y0, x1, y1) {
        var dy = y1 - y0;
        var dx = x1 - x0;
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
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                if (this.get(x, y) === ' ') {
                    var c = frnd();
                    this.set(x, y, c);
                }
            }
        }
    };

    // ==================================================================

    module.exports = {
        Grid: Grid,
        GridWord: GridWord,
        sliceParams: sliceParams
    };
}());
