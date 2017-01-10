
// Given dx,dy, find the angle and snap it to one of the 8 directions.
function snapAngle(dx, dy) {
    var angle = Math.atan2(dy, dx);
    if (angle < 0) {
        angle += Math.TAU;
    }
    // snap to 8 directions, 0=E, 1=SE, 2=S, 3=SW, etc.
    // TODO: hysteresis based on the direction you're dragging in
    var direction = (Math.floor(((angle-Math.TAU/16) / Math.TAU) * 8) + 1)%8;
    angle = direction * (Math.TAU/8);
    return [angle, direction];
}

// https://www.kirupa.com/html5/get_element_position_using_javascript.htm
function getPosition(e) {
    var x = 0;
    var y = 0;
    while (e) {
        if (e.tagName === 'BODY') {
            // deal with browser quirks with body/window/document and page scroll
            var xsc = e.scrollLeft || document.documentElement.scrollLeft;
            var ysc = e.scrollTop || document.documentElement.scrollTop;
            x += (e.offsetLeft - xsc + e.clientLeft);
            y += (e.offsetTop - ysc + e.clientTop);
        } else {
            // for all other non-BODY elements
            x += (e.offsetLeft - e.scrollLeft + e.clientLeft);
            y += (e.offsetTop - e.scrollTop + e.clientTop);
        }
        e = e.offsetParent;
    }
    return { x:x, y:y };
}

// ==================================================================

function cid(r, c) {
    return 'c'+r+'_'+c;
}

function Cell(s, r, c) {
    this.letter = s;
    this.row = r;
    this.column = c;
    this.pageX = 0;
    this.pageY = 0;
    this.pageSize = 46;
    this.borderSize = 0;

    this.id = function() {
        return cid(this.row, this.column);
    };

    this.containsPoint = function(p) {
        return (p.x >= this.pageX &&
                p.x < (this.pageX + this.pageSize) &&
                p.y >= this.pageY &&
                p.y < (this.pageY + this.pageSize));
    };
}

// ==================================================================

function Ring(cell) {
    this.ring = null;
    this.startCell = cell;
    this.endCell = null;
    this.word = '';

    this.calculateMetrics = function() {
        // displayPuzzle() sets this on the prototype.
        //this.borderSize = Ring.prototype.borderSize;
        this.size = this.startCell.pageSize * 2 / 3;
        this.pageX = this.startCell.pageX;
        this.pageY = this.startCell.pageY;
        this.cx = (this.startCell.pageX + this.startCell.pageSize/2);
        this.cy = (this.startCell.pageY + this.startCell.pageSize/2);
        this.cellOffset = (this.startCell.pageSize - this.size) / 2;
    };
    this.calculateMetrics();

    this.destroy = function() {
        if (this.ring) {
            this.ring.remove();
        }
        this.startCell = null;
        this.endCell = null;
    };

    this.calcWidth = function() {
        if (!this.startCell || !this.endCell) {
            return this.size;
        }
        var dx = this.endCell.pageX - this.startCell.pageX;
        var dy = this.endCell.pageY - this.startCell.pageY;
        if (dx === 0 && dy === 0) {
            return this.size;
        }
        var dist = Math.sqrt(dx*dx + dy*dy);
        return dist + this.size;
    };

    this.resize = function() {
        // position the ring.
        if (this.startCell) {
            var y = this.startCell.pageY + this.cellOffset - this.borderSize;
            var x = this.startCell.pageX + this.cellOffset - this.borderSize;
            this.ring.style('top', '' + y + 'px')
                     .style('left', '' + x + 'px')
                     .style('height', '' + this.size + 'px')
            ;

            // scale, translate, and rotate the ring.
            if (this.endCell) {
                var wid = this.calcWidth();
                var haf = this.size/2 + this.borderSize;
                var a = snapAngle(this.endCell.pageX - this.startCell.pageX,
                    this.endCell.pageY - this.startCell.pageY);
                var rot = a[0] * (360.0/Math.TAU);
                this.ring.style('width', '' + wid + 'px')
                         .style('transform-origin', ''+haf+'px '+haf+'px')
                         .style('transform', 'rotate(' + rot + 'deg)')
                ;
            } else {
                this.ring.style('width', '' + this.size + 'px')
                         .style('transform-origin', null)
                         .style('transform', null)
                ;
            }
        }
    };

}

// ==================================================================

module.exports = {
    cid:cid,
    Cell:Cell,
    Ring:Ring,
    snapAngle:snapAngle,
    getPosition:getPosition
};
