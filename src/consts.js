(function () {
'use strict';

if (!Math.TAU) {
    Math.TAU = Math.PI * 2;
}

exports.ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
exports.ALPHABET64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
exports.MIN_WORDLEN = 4;
exports.MAX_WORDLEN = 7;
exports.MAX_WORD_GEN_FAILURES = 10;
exports.TRANSITION_TIME = (1.0 / 15.0) * 1000;

exports.WORDLIST_TAG_WORDLIST = '### WORDLIST ###';
exports.WORDLIST_TAG_BLACKLIST = '### BLACKLIST ###';


}());
