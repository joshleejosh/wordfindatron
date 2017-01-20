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

    function bailout(m, v) {
        if (v) {
            v.msgWrite(m);
        }
        throw Error(m);
    }

    function buildWordlists(clob) {
        var curlist = wordlist;
        var lines = clob.split('\n');
        for (var i=0; i<lines.length; i++) {
            var line = lines[i];

            if (line.startsWith(consts.WORDLIST_TAG_WORDLIST)) {
                curlist = wordlist;
            } else if (line.startsWith(consts.WORDLIST_TAG_BLACKLIST)) {
                curlist = blacklist;
            }

            if (line.length === 0) {
                continue;
            }
            if (line.startsWith('#')) {
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

        /*
        for (i=0; i<wordlist.length; i++) {
            console.log(i, wordlist[i].length, wordlist[i][0]);
        }
        console.log('B', blacklist.length);
        */
    }

    function load(view, callback) {
        if (wordlist && blacklist) {
            return callback();
        }
        wordlist = [];
        blacklist = [];

        if (view) {
            // ajax request
            view.msgWrite('Loading...');
            d3.text('wordlists.txt', function(clob) {
                if (clob) {
                    buildWordlists(clob);
                    return callback();
                }
                bailout('Couldn\'t load wordlist', view);
                return null;
            });
        } else {
            // local file load
            var fs = require('fs');
            fs.readFile('wordlists.txt', 'utf8', function(err, clob) {
                if (err) {
                    throw err;
                }
                buildWordlists(clob);
                return callback();
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
