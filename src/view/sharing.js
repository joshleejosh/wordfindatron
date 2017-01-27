(function() {
    'use strict';

    var d3 = require('d3');

    function joinParams(o) {
        var a = d3.entries(o).map(function (p) {
            return encodeURI(p.key) + '=' + encodeURI(p.value);
        });
        var rv = '?' + a.join('&');
        return rv;
    }

    function web(link) {
        d3.select('#share_link').attr('href', link);
    }

    function email(link) {
        var url = 'mailto:?subject=WORDFINDATRON&body='+link;
        d3.select('#share_email').attr('href', url);
    }

    function twitter(link) {
        var url = 'https://twitter.com/intent/tweet' + joinParams({
            'original_referrer': window.location,
            'text': 'WORDFINDATRON',
            'url': link
        });
        d3.select('#share_twitter').attr('href', url);
    }

    function facebook(link) {
        var url = 'https://www.facebook.com/sharer/sharer.php' + joinParams({
            'u': link
        });
        d3.select('#share_facebook').attr('href', url);
    }

    function reddit(link) {
        var url = 'http://www.reddit.com/submit' + joinParams({
            'url': link
        });
        d3.select('#share_reddit').attr('href', url);
    }

    function setLinks(puz) {
        var link = window.location.protocol + '//' +
                   window.location.hostname +
                   window.location.pathname +
                   '?p=' + puz.serialize();
        web(link);
        email(link);
        twitter(link);
        facebook(link);
        reddit(link);
    }

    module.exports = {
        setLinks: setLinks
    };
}());
