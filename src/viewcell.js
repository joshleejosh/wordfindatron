(function () {
'use strict';
var util = require('./util');

function cid(r, c) {
    return 'c'+r+'_'+c;
}

function Cell(s, r, c) {
    this.element = null;
    this.selection = null;
    this.letter = s;
    this.row = r;
    this.column = c;
    this.size = 46;
    this.borderSize = 0;

    this.id = function() {
        return cid(this.row, this.column);
    };

    this.getPagePosition = function() {
        if (this.element) {
            return util.getElementPosition(this.element);
        }
        throw Error('Cell.getPosition: No element for ['+this.column+','+this.row+']');
    };

    this.containsPoint = function(p) {
        return (p.x >= this.pageX &&
                p.x < (this.pageX + this.pageSize) &&
                p.y >= this.pageY &&
                p.y < (this.pageY + this.pageSize));
    };
}

module.exports = {
    cid:cid,
    Cell:Cell
};

}());
