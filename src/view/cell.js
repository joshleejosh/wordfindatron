(function() {
    'use strict';

    function cid(x, y) {
        return 'c'+x+'_'+y;
    }

    function Cell(s, x, y) {
        this.element = null;
        this.selection = null;
        this.letter = s;
        this.x = x;
        this.y = y;
        this.size = 46;
        this.borderSize = 0;
    }

    Cell.prototype.id = function() {
        return cid(this.x, this.y);
    };

    Cell.prototype.getPagePosition = function() {
        if (!this.element) {
            throw Error('Cell.getPosition: No element for ['+this.x+','+this.y+']');
        }
        var p = this.element.getBoundingClientRect();
        return {x: p.left, y: p.top};
    };

    module.exports = {
        cid: cid,
        Cell: Cell
    };
}());
