beforeEach(function() {
    jasmine.addMatchers({
        toMatchGridWord: function() {
            return {
                compare: function (gw, d, s, o, w, sx, sy, ex, ey) {
                    return {
                        pass: (gw.direction === d &&
                            gw.slice === s &&
                                gw.offset === o &&
                                gw.word === w &&
                                gw.startLocation.x === sx &&
                                gw.startLocation.y === sy &&
                                gw.endLocation.x === ex &&
                                gw.endLocation.y === ey)
                    }
                }
            };
        }
    });
});

