describe('Test Util', function(){
    util = require('../src/util');

    describe('range()', function() {
        it('makes [0,max) from a single arg', function() {
            expect(util.range(0)).toEqual([]);
            expect(util.range(1)).toEqual([0]);
            expect(util.range(5)).toEqual([0,1,2,3,4]);
        });

        it('makes [min,max) from two args', function() {
            expect(util.range(0,4)).toEqual([0,1,2,3]);
            expect(util.range(1,4)).toEqual([1,2,3]);
            expect(util.range(5,7)).toEqual([5,6]);
        });

        it('makes stepped ranges', function() {
            expect(util.range( 0,  1, 2)).toEqual([0]);
            expect(util.range( 0,  9, 2)).toEqual([0, 2, 4, 6, 8]);
            expect(util.range( 5, 15, 3)).toEqual([5, 8, 11, 14]);
            expect(util.range(-7, 12, 4)).toEqual([-7, -3, 1, 5, 9]);
        });

        it('makes ranges with negative steps', function() {
            expect(util.range( 7,  2, -1)).toEqual([7, 6, 5, 4, 3]);
            expect(util.range( 7,  2, -2)).toEqual([7, 5, 3]);
            expect(util.range(15, -7, -3)).toEqual([15, 12, 9, 6, 3, 0, -3, -6]);
        });

        it('fails on an invalid step arg', function() {
            try {
                var a = util.range(2, 7, 0);
                fail('oops: ' + a);
            } catch (e) { }
        });

        it('flips min and max when they\'re the wrong way around', function() {
            // (note: python's range returns empty list in this case)
            expect(util.range(7, 2, 2)).toEqual([2, 4, 6]);
            expect(util.range(2, 7, -2)).toEqual([7, 5, 3]);
        });
    });

    describe('snapAngle', function() {
        var τ = Math.TAU;

        it('returns the angle for cardinal and diagonal directions', function(){
            expect(util.snapAngle( 1,  0)).toEqual([      0, 0]);
            expect(util.snapAngle( 1,  1)).toEqual([  (τ/8), 1]);
            expect(util.snapAngle( 0,  1)).toEqual([2*(τ/8), 2]);
            expect(util.snapAngle(-1,  1)).toEqual([3*(τ/8), 3]);
            expect(util.snapAngle(-1,  0)).toEqual([4*(τ/8), 4]);
            expect(util.snapAngle(-1, -1)).toEqual([5*(τ/8), 5]);
            expect(util.snapAngle( 0, -1)).toEqual([6*(τ/8), 6]);
            expect(util.snapAngle( 1, -1)).toEqual([7*(τ/8), 7]);
        });

        it('snaps the angle to the nearest octant', function(){
            function check(a, r, d) {
                var p = [r * Math.cos(a), r * Math.sin(a)];
                expect(util.snapAngle(p[0],p[1])).toEqual([d*(τ/8), d]);
            }
            // check edges of octant boundaries on a circle of radius 10
            function check3(i, a, b, c) {
                check(i*(τ/16)-0.001, 10, a);
                check(i*(τ/16)      , 10, b);
                check(i*(τ/16)+0.001, 10, c);
            }
            check3( 1, 0, 1, 1);
            check3( 3, 1, 2, 2);
            check3( 5, 2, 3, 3);
            check3( 7, 3, 4, 4);
            check3( 9, 4, 4, 5);
            check3(11, 5, 5, 6);
            check3(13, 6, 7, 7);
            check3(15, 7, 7, 0);
        });

    });

});
