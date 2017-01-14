(function() {
    'use strict';

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
    }

    Cell.prototype.id = function() {
        return cid(this.row, this.column);
    };

    Cell.prototype.getPagePosition = function() {
        if (!this.element) {
            throw Error('Cell.getPosition: No element for ['+this.column+','+this.row+']');
        }
        var p = this.element.getBoundingClientRect();
        return {x: p.left, y: p.top};
    };

    module.exports = {
        cid: cid,
        Cell: Cell
    };
}());
