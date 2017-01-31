(function() {
    'use strict';

    var d3 = require('d3');
    var consts = require('../consts');

    var wordlist, blacklist;

    function getWordlist(wl) {
        return wordlist[wl];
    }

    function getBlacklist() {
        return blacklist;
    }

    function buildWordlists(clob) {
        var curlist = wordlist;
        var lines = clob.split('\n');
        for (var i=0; i<lines.length; i++) {
            var line = lines[i];

            if (line.lastIndexOf(consts.WORDLIST_TAG_WORDLIST) === 0) {
                curlist = wordlist;
            } else if (line.lastIndexOf(consts.WORDLIST_TAG_BLACKLIST) === 0) {
                curlist = blacklist;
            }

            if (line.length === 0) {
                continue;
            }
            if (line[0] === '#') {
                continue;
            }

            if (curlist === wordlist) {
                if (wordlist.length < line.length+1) {
                    for (var j=wordlist.length; j<line.length+1; j++) {
                        wordlist.push([]);
                    }
                }
                wordlist[line.length].push(line.trim());
            } else if (curlist === blacklist) {
                curlist.push(line);
            }
        }
    }

    function load(doRemote, callback) {
        if (wordlist && blacklist) {
            return callback();
        }
        wordlist = [];
        blacklist = [];

        if (doRemote) {
            // ajax request
            d3.text('wordlists.txt', function(clob) {
                if (clob) {
                    buildWordlists(clob);
                    return callback();
                }
                return callback(new Error('Couldn\'t load wordlist'));
            });
        } else {
            // local file load
            var fs = require('fs');
            fs.readFile('wordlists.txt', 'utf8', function(err, clob) {
                if (!err) {
                    buildWordlists(clob);
                }
                return callback(err);
            });
        }
        return null;
    }

    module.exports = {
        getWordlist: getWordlist,
        getBlacklist: getBlacklist,
        load: load
    };
}());
