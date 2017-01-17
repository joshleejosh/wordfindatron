(function() {
    'use strict';

    if (!Math.TAU) {
        Math.TAU = Math.PI * 2;
    }

    exports.CHEAT = true;
    exports.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    exports.ALPHABET64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    exports.MAX_GRID_SIZE = 16;
    exports.MIN_WORDLEN = 4;
    exports.MAX_WORDLEN = 7;
    exports.MAX_CONFLICT_RETRIES = 20;

    exports.TWEEN_TIME = (1.0 / 15.0) * 1000;
    exports.FADE_TIME = exports.TWEEN_TIME * 4;

    exports.WORDLIST_TAG_WORDLIST = '### WORDLIST ###';
    exports.WORDLIST_TAG_BLACKLIST = '### BLACKLIST ###';

}());
