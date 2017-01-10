var d3 = require('d3');

var wordlist, blacklist;

function getWordlist(wl) {
    return wordlist[wl];
}
function getBlacklist() {
    return blacklist;
}

function makeWordlist(clobw) {
    wordlist = {};
    for (var i=0; i<20; i++) {
        wordlist[i] = [];
    }
    var words = clobw.split('\n');
    for (i=0; i<words.length; i++) {
        if (words[i]) {
            wordlist[words[i].length].push(words[i]);
        }
    }
}

function bailout(m, v) {
    console.log(m);
    if (v) {
        v.messageArea.text(m);
    }
}

function load(view, callback) {
    if (wordlist && blacklist) {
        callback();
    } else {
        if (view) {
            // ajax requests
            view.messageArea.text('Loading...');
            d3.text('data/words7.txt', function(clobw) {
                if (clobw) {
                    makeWordlist(clobw);
                    d3.text('data/blacklist.txt', function(clobb) {
                        if (clobb) {
                            blacklist = clobb.split('\n');
                            callback();
                        } else {
                            bailout('Couldn\'t load blacklist', view);
                        }
                    });
                } else {
                    bailout('Couldn\'t load wordlist', view);
                }
            });
        } else {
            // local file loads
            var fs = require('fs');
            console.log('Loading wordlist...');
            fs.readFile('data/words7.txt', 'utf8', function(err, clobw) {
                if (err) {
                    throw err;
                }
                makeWordlist(clobw);
                console.log('wordlist lengths: ');
                for (var i=0; i<20; i++) {
                    if (wordlist[i].length > 0) {
                        console.log('\t', i, wordlist[i].length);
                    }
                }
                console.log('Loading blacklist...');
                fs.readFile('data/blacklist.txt', 'utf8', function(err, clobb) {
                    if (err) {
                        throw err;
                    }
                    blacklist = clobb.split('\n');
                    console.log(''+blacklist.length+' words in blacklist.');
                    callback();
                });
            });
        }
    }
}


module.exports = {
    getWordlist:getWordlist,
    getBlacklist:getBlacklist,
    load:load
};
