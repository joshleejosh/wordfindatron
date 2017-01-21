describe('Test bstream', function(){
    var bstream = require('../src/model/bstream');

    describe('i2hex', function() {
        it('converts an integer to hex', function() {
            expect(bstream.i2hex(0, 1)).toBe('0');
            expect(bstream.i2hex(9, 1)).toBe('9');
            expect(bstream.i2hex(15, 1)).toBe('f');
            expect(bstream.i2hex(78, 2)).toBe('4e');
            expect(bstream.i2hex(1234, 3)).toBe('4d2');
            expect(bstream.i2hex(Number.MAX_SAFE_INTEGER, 14)).toBe('1fffffffffffff');
        });
        it('0-pads when given width', function() {
            expect(bstream.i2hex(0, 4)).toBe('0000');
            expect(bstream.i2hex(9, 5)).toBe('00009');
            expect(bstream.i2hex(15, 6)).toBe('00000f');
            expect(bstream.i2hex(78, 3)).toBe('04e');
            expect(bstream.i2hex(1234, 7)).toBe('00004d2');
            expect(bstream.i2hex(Number.MAX_SAFE_INTEGER, 20)).toBe('0000001fffffffffffff');
        });
        it('does not truncate when not given enough width', function() {
            expect(bstream.i2hex(78, 2)).toBe('4e');
            expect(bstream.i2hex(1234, 2)).toBe('4d2');
            expect(bstream.i2hex(59874, 3)).toBe('e9e2');
            expect(bstream.i2hex(Number.MAX_SAFE_INTEGER, 11)).toBe('1fffffffffffff');
        });
        it('freaks out on negative numbers', function() {
            expect(bstream.i2hex(-1, 2)).toBe('-1');
            expect(bstream.i2hex(-1234, 5)).toBe('0-4d2'); // yuck
        });
    });

    describe('i2binary', function() {
        it('converts an integer to binary', function() {
            expect(bstream.i2binary(0, 1)).toBe('0');
            expect(bstream.i2binary(9, 4)).toBe('1001');
            expect(bstream.i2binary(15, 4)).toBe('1111');
            expect(bstream.i2binary(78, 7)).toBe('1001110');
            expect(bstream.i2binary(1234, 11)).toBe('10011010010');
            expect(bstream.i2binary(Number.MAX_SAFE_INTEGER, 53)).toBe('11111111111111111111111111111111111111111111111111111');
        });
        it('0-pads when given width', function() {
            expect(bstream.i2binary(0, 4)).toBe('0000');
            expect(bstream.i2binary(9, 5)).toBe('01001');
            expect(bstream.i2binary(15, 6)).toBe('001111');
            expect(bstream.i2binary(78, 10)).toBe('0001001110');
            expect(bstream.i2binary(1234, 17)).toBe('00000010011010010');
            expect(bstream.i2binary(Number.MAX_SAFE_INTEGER, 57)).toBe('000011111111111111111111111111111111111111111111111111111');
        });
        it('does not truncate when not given enough width', function() {
            expect(bstream.i2binary(78, 2)).toBe('1001110');
            expect(bstream.i2binary(1234, 2)).toBe('10011010010');
            expect(bstream.i2binary(59874, 3)).toBe('1110100111100010');
            expect(bstream.i2binary(Number.MAX_SAFE_INTEGER, 11)).toBe('11111111111111111111111111111111111111111111111111111');
        });
        it('freaks out on negative numbers', function() {
            expect(bstream.i2binary(-1, 2)).toBe('-1');
            expect(bstream.i2binary(-1234, 13)).toBe('0-10011010010'); // yuck
        });
    });

    describe('buf2hex', function() {
        it('pretty-prints an array of 8-bit integers', function() {
            var a = [
                 0, 255,  1, 47,   9, 244, 11, 17, 88,  27, 69, 43, 109,  30, 76, 89,
                90
            ];
            expect(bstream.buf2hex(a)).toBe('00 ff 01 2f 09 f4 0b 11 58 1b 45 2b 6d 1e 4c 59 \n5a \n');
        });
    });

    describe('buf2binary', function() {
        it('pretty-prints an array of 8-bit integers', function() {
            var a = [
                 0, 255,  1, 47,   9, 244, 11, 17, 88,  27, 69, 43, 109,  30, 76, 89,
                90
            ];
            expect(bstream.buf2binary(a)).toBe('00000000 11111111 00000001 00101111 00001001 11110100 00001011 00010001 \n01011000 00011011 01000101 00101011 01101101 00011110 01001100 01011001 \n01011010 \n');
        });
    });

});
