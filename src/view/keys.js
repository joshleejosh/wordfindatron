(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');

    // ==================================================================

    function bind(callbacks) {
        d3.select('body').on('keyup', function() {
            if (!callbacks.canDo()) {
                return;
            }

            switch (d3.event.key) {
            case 'u':
            case 'U':
                callbacks.onUndo();
                break;
            case 'r':
            case 'R':
                callbacks.onReset();
                break;
            case 'h':
            case 'H':
                callbacks.onHint();
                break;
            case 's':
            case 'S':
                callbacks.onShuffle();
                break;
            case 'n':
            case 'N':
                callbacks.onNew();
                break;
            case 'e':
            case 'E':
                callbacks.onEdit();
                break;
            case 'c': // Cheat
            case 'C':
                if (consts.CHEAT) {
                    callbacks.onSolve();
                }
                break;
            case '?':
            case '/':
                callbacks.onHelp();
                break;

            default:
                break;
            }
        });
    }

    module.exports = {
        bind: bind
    };
}());
