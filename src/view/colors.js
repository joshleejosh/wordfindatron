(function() {
    'use strict';

    function setColor(k, c) {
        module.exports[k] = c;
    }

    module.exports = {
        setColor: setColor
    };
}());
