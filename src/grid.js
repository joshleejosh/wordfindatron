const consts = require('./consts');
const util = require('./util');

const Grid = function(size) {
    this.grid = [];
    this.size = size;
    for (var r=0; r<this.size; r++) {
        var row = [];
        for (var c=0; c<this.size; c++)
            row.push(' ');
        this.grid.push(row);
    }

    /*
     * Fill in this grid from the given string.
     */
    this.fromString = function(s) {
        for (var r=0,i=0; r<this.size && i<s.length; r++)
            for (var c=0; c<this.size && i<s.length; c++,i++)
                this.grid[r][c] = s[i];
        return this;
    };

    /*
     * Return the grid as a string, formatted into rows.
     */
    this.toString = function() {
        rv = '';
        for (var r=0,i=0; r<this.size; r++) {
            for (var c=0; c<this.size; c++,i++)
                rv += this.grid[r][c];
            rv += '\n';
        }
        return rv;
    };

    /*
     * Make a copy of this grid.
     */
    this.copy = function() {
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
    this.cutSlice = function(di, si) {
        var a = util.sliceParams(this.size, di, si);
        var x = a[0], y = a[1], dx = a[2], dy = a[3];
        cut = '';
        while (0 <= x && x < this.size && 0 <= y && y < this.size) {
            cut += this.grid[y][x];
            x += dx;
            y += dy;
        }
        return cut;
    };

    this.fillSlice = function(di, si, offset, word) {
        var a = util.sliceParams(this.size, di, si);
        var x = a[0], y = a[1], dx = a[2], dy = a[3];
        x += dx * offset;
        y += dy * offset;
        for (var i=0; i<word.length && x>=0 && x<this.size && y>=0 && y<this.size; i++) {
            var c = word[i];
            // if it's a unicode surrogate pair, grab the second character.
            if (/[\uD800-\uDFFF]/.test(c)) {
                i++;
                c += word[i];
            }
            this.grid[y][x] = c;
            x += dx;
            y += dy;
        }
    };

    this.fillJunk = function() {
        for (var r=0; r<this.size; r++)
            for (var c=0; c<this.size; c++)
                if (this.grid[r][c] == ' ')
                    this.grid[r][c] = consts.ALPHABET.charAt(util.rndint(0,25));
    };
};

module.exports = {Grid:Grid};
