(function() {
    'use strict';

    // ==================================================================


    function makeToolbarButton(par, cb, id, ic, ti) {
        var b = par.append('button')
            .attr('id', id)
            .attr('type', 'button')
            .attr('title', ti)
            .on('click', cb)
        ;
        b.append('i')
            .classed('fa', true)
            .classed('fa-'+ic, true)
            .classed('fa-fw', true)
        ;
        return b;
    }

    function makeToolbarSeparator(par) {
        return par.append('span').classed('tbseparator', true);
    }


    // ==================================================================

    module.exports = {
        makeToolbarButton: makeToolbarButton,
        makeToolbarSeparator: makeToolbarSeparator
    };
}());
