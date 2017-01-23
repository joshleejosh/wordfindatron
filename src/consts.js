(function() {
    'use strict';

    if (!Math.TAU) {
        Math.TAU = Math.PI * 2;
    }

    exports.CHEAT = require('./_generated').CHEAT;
    exports.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    exports.ALPHABET64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    exports.MAX_GRID_SIZE = 16;
    exports.MAX_CONFLICT_RETRIES = 100;

    exports.TWEEN_TIME = (1.0 / 15.0) * 1000;
    exports.FADE_TIME = exports.TWEEN_TIME * 4;

    exports.WORDLIST_TAG_WORDLIST = '### WORDLIST ###';
    exports.WORDLIST_TAG_BLACKLIST = '### BLACKLIST ###';

    exports.MIN_GRID_SIZE = 8;
    exports.MAX_GRID_SIZE = 20;
    exports.MIN_MIN_WORDLEN = 4;
    exports.MAX_MAX_WORDLEN = 9;
    exports.MIN_DENSITY = 0.333;
    exports.MAX_DENSITY = 0.667;

}());
