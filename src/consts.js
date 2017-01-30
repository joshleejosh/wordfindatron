(function() {
    'use strict';

    if (!Math.TAU) {
        Math.TAU = Math.PI * 2;
    }

    exports.CHEAT = require('./_generated').CHEAT;
    exports.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    exports.ALPHABET64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    exports.MAX_CONFLICT_RETRIES = 100;

    exports.TWEEN_TIME = (1.0 / 15.0) * 1000;
    exports.FADE_TIME = exports.TWEEN_TIME * 4;

    exports.WORDLIST_TAG_WORDLIST = '### WORDLIST ###';
    exports.WORDLIST_TAG_BLACKLIST = '### BLACKLIST ###';

    exports.MIN_GRID_SIZE = 8;
    exports.MAX_GRID_SIZE = 20;
    exports.GRID_SIZE_STEP = 4;
    exports.MIN_MIN_WORDLEN = 4;
    exports.MAX_MAX_WORDLEN = 9;
    exports.MIN_DENSITY = 0.300;
    exports.MAX_DENSITY = 0.600;
    exports.DENSITY_STEP = 0.100;
    exports.DEFAULT_GRID_SIZE = 12;
    exports.DEFAULT_DENSITY = 0.400;

    exports.MSG_SHUFFLE_FAIL = 'Sorry, I had a problem shuffling this puzzle. You can either try <i class="fa fa-random"></i> again and see if it shakes loose, or make a different puzzle with <i class="fa fa-eject"></i>.';

    exports.MSG_NEW_FAIL = 'Sorry, I had a problem creating a puzzle. Either hit <i class="fa fa-eject"></i> or reload the page to try again.';

}());
