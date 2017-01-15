(function () {
    'use strict';

    // https://gist.github.com/claus/2829664
    // Usage:
    // var buf = new Uint8Array(128);
    // var bitstream = new BitStream(buf);
    // bitstream.writeBits(12, 0xffff);
    // bitstream.seekTo(0);
    // bitstream.readBits(6); // 111111
    // bitstream.readBits(10); // 1111110000

    function BitStream(uint8Array) {
        this.a = uint8Array;
        this.position = 0;
        this.bitsPending = 0;
    }

    BitStream.prototype.writeBits = function(value, bits) {
        if (bits === 0) {
            return;
        }
        value &= (0xffffffff >>> (32 - bits));
        var bitsConsumed;
        if (this.bitsPending > 0) {
            if (this.bitsPending > bits) {
                this.a[this.position - 1] |= value << (this.bitsPending - bits);
                bitsConsumed = bits;
                this.bitsPending -= bits;
            } else if (this.bitsPending === bits) {
                this.a[this.position - 1] |= value;
                bitsConsumed = bits;
                this.bitsPending = 0;
            } else {
                this.a[this.position - 1] |= value >> (bits - this.bitsPending);
                bitsConsumed = this.bitsPending;
                this.bitsPending = 0;
            }
        } else {
            bitsConsumed = Math.min(8, bits);
            this.bitsPending = 8 - bitsConsumed;
            this.a[this.position++] = (value >> (bits - bitsConsumed)) << this.bitsPending;
        }
        bits -= bitsConsumed;
        if (bits > 0) {
            this.writeBits(value, bits);
        }
    };

    BitStream.prototype.readBits = function(bits, bitBuffer) {
        if (typeof bitBuffer === 'undefined') {
            bitBuffer = 0;
        }
        if (bits === 0) {
            return bitBuffer;
        }
        var partial;
        var bitsConsumed;
        if (this.bitsPending > 0) {
            var b = this.a[this.position - 1] & (0xff >> (8 - this.bitsPending));
            bitsConsumed = Math.min(this.bitsPending, bits);
            this.bitsPending -= bitsConsumed;
            partial = b >> this.bitsPending;
        } else {
            bitsConsumed = Math.min(8, bits);
            this.bitsPending = 8 - bitsConsumed;
            partial = this.a[this.position++] >> this.bitsPending;
        }
        bits -= bitsConsumed;
        bitBuffer = (bitBuffer << bitsConsumed) | partial;
        return (bits > 0) ? this.readBits(bits, bitBuffer) : bitBuffer;
    };

    BitStream.prototype.seekTo = function(bitPos) {
        this.position = (bitPos / 8) | 0;
        this.bitsPending = bitPos % 8;
        if (this.bitsPending > 0) {
            this.bitsPending = 8 - this.bitsPending;
            this.position++;
        }
    };

    // ===================================================================

    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    function toBase64(bs) {
        if (bs instanceof Uint8Array) {
            bs = new BitStream(bs);
        }
        var rv = '';
        bs.seekTo(0);
        for (var i=0; i<bs.a.length*8; i+=6) {
            var n = bs.readBits(6);
            var c = B64[n];
            rv += c;
        }
        if (bs.a.length%3 === 1) {
            rv += '==';
        } else if (bs.a.length%3 === 2) {
            rv += '=';
        }
        return rv;
    }

    function fromBase64(s) {
        var rv = new BitStream(new Uint8Array(s.length * 8));
        for (var i=0; i<s.length; i++) {
            var c = s[i];
            if (c === '=') {
                break;
            }
            var n = B64.indexOf(c);
            rv.writeBits(n, 6);
        }
        rv.seekTo(0);
        return rv;
    }

    // ===================================================================

    function i2hex(i,r) {
        var buf = '';
        for (var j=0; j<r; j++) {
            buf += '0';
        }
        return (buf + i.toString(16)).substr(-r);
    }

    function i2binary(i, bits) {
        var rv = '';
        for (var j=0; j<bits; j++) {
            rv = '' + ((i>>j)&1) + rv;
        }
        return rv;
    }

    function buf2hex(buf) {
        var rv = '';
        for (var r=0,i=0; i<buf.length; r++) {
            for (var c=0; c<16 && i<buf.length; c++) {
                var n = buf[i++];
                rv += i2hex(n,2) + ' ';
            }
            rv += '\n';
        }
        return rv;
    }

    function buf2binary(buf) {
        var rv = '';
        for (var r=0,i=0; i<buf.length; r++) {
            for (var c=0; c<8 && i<buf.length; c++) {
                var n = buf[i++];
                rv += i2binary(n,8) + ' ';
            }
            rv += '\n';
        }
        return rv;
    }

    // split a 53-bit integer (per Number.MAX_SAFE_INTEGER) into
    // two uints: a 23-bit high word and a 30-bit low word.
    // cf. http://stackoverflow.com/a/19274574
    function splitInt(i) {
        var lo = i & 0x3fffffff;
        var hi = (i - lo) / 0x40000000;
        return [hi, lo];
    }
    function joinInt(hi, lo) {
        return ((hi & 0x7fffff) * 0x40000000) + (lo & 0x3fffffff);
    }

    module.exports = {
        BitStream: BitStream,
        buf2hex: buf2hex,
        buf2binary: buf2binary,
        i2binary: i2binary,
        i2hex: i2hex,
        toBase64: toBase64,
        fromBase64: fromBase64,
        splitInt: splitInt,
        joinInt: joinInt
    };
}());
