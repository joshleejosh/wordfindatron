describe('Test puzgen', function(){
    var Random = require('random-js');
    var puzzle = require('../src/model/puzzle');
    var puzgen = require('../src/model/puzgen');

    describe('SliceShuffler', function() {
        beforeEach(function() {
            this.puzzle = new puzzle.Puzzle(6, -45123419);
            this.gen = new puzgen.Generator(this.puzzle);
            this.shuffler = this.gen.shuffler;
        });

        it('maintains a shuffled hierarchical structure of directions and slices', function() {
            expect(this.shuffler.gridSize).toBe(6);
            expect(this.shuffler.minLen).toBe(4);
            expect(this.shuffler.length).toBe(44);
            expect(this.shuffler.rng).toBe(this.gen.rng);
        });

        it('serves shuffled directions', function() {
            var a = [];
            for (var i=0; i<16; i++) {
                a.push(this.shuffler.direction);
                this.shuffler.nextDirection();
            }
            expect(a).toEqual([4, 0, 7, 1, 3, 5, 2, 6, 5, 2, 6, 3, 4, 1, 7, 0]);
        });

        it('serves shuffled slices for the current direction', function() {
            var f = function(sh, n, d) {
                var rv = [];
                for (var i=0; i<n; i++) {
                    rv.push(sh.slice);
                    expect(sh.direction).toBe(d);
                    sh.nextSlice();
                }
                return rv;
            }
            expect(f(this.shuffler, 6, 4)).toEqual([4, 2, 0, 5, 1, 3]);
            // tick over to the next direction when you keep requesting slices
            expect(f(this.shuffler, 6, 0)).toEqual([1, 5, 3, 0, 4, 2]);
            expect(f(this.shuffler, 5, 7)).toEqual([3, 7, 4, 5, 6]);
            expect(f(this.shuffler, 5, 1)).toEqual([7, 3, 5, 4, 6]);
        });

        it('flushes slices when you change direction', function() {
            expect(this.shuffler.direction).toBe(4);
            expect(this.shuffler.slice).toBe(4);
            this.shuffler.nextDirection();
            expect(this.shuffler.direction).toBe(0);
            expect(this.shuffler.slice).toEqual(1);
        });
    });

    describe('fitWord()', function() {
        beforeEach(function() {
            var puz = new puzzle.Puzzle(7, -45123424);
            this.gen = new puzgen.Generator(puz);
        });

        it('safely rejects empty arguments', function() {
            expect(this.gen.fitWord()).toBe(-1);
            expect(this.gen.fitWord('', '')).toBe(-1);
            expect(this.gen.fitWord('BAR', '')).toBe(-1);
            expect(this.gen.fitWord('', '   ')).toBe(-1);
        });

        it('can place words into a blank rack', function() {
            expect(this.gen.fitWord('BAR', '  ')).toBe(-1); // too short
            expect(this.gen.fitWord('BAR', '   ')).toBe(0);
            // offsets are starting to get seed dependent
            expect(this.gen.fitWord('BAR', '    ')).toBe(0);
            expect(this.gen.fitWord('BAR', '     ')).toBe(0);
            expect(this.gen.fitWord('BAR', '      ')).toBe(0);
            expect(this.gen.fitWord('BAR', '       ')).toBe(2);
        });

        it('can fit words around existing letters in a rack', function() {
            expect(this.gen.fitWord('BAR', 'B  ')).toBe(0);
            expect(this.gen.fitWord('BAR', ' A ')).toBe(0);
            expect(this.gen.fitWord('BAR', '  R')).toBe(0);
            expect(this.gen.fitWord('BAR', 'X  R ')).toBe(1);
            expect(this.gen.fitWord('BAR', ' F ')).toBe(-1);
        });
    });

    describe('applyAnswer()', function() {
        beforeEach(function() {
            this.puz = new puzzle.Puzzle(6, 54321);
            this.gen = new puzgen.Generator(this.puz);
        });

        it('places a word into the grid and turns it into an answer', function() {
            expect(this.gen.applyAnswer('GRUNT').word).toBe('GRUNT');
            expect(this.gen.applyAnswer('FUNK').word).toBe('FUNK');
            expect(this.gen.applyAnswer('PARTY').word).toBe('PARTY');
        });

        it('freaks out when it can\'t fit a word', function() {
            expect(()=>{ return this.gen.applyAnswer('TOOLONGWORD'); }).toThrowError();
            this.gen.applyAnswer('GRUNT');
            this.gen.applyAnswer('FUNK');
            this.gen.applyAnswer('PARTY');
            expect(()=>{ return this.gen.applyAnswer('BADWORD'); }).toThrowError();
        });
    });

    describe('constructing with pre-set words', function() {
        it('puts the words in the grid and turns them into answers', function() {
            var puz = new puzzle.Puzzle(7, -215423);
            puz.applyWords([]);
            expect(puz.answers.length).toBe(0);

            puz = new puzzle.Puzzle(7, -215423);
            puz.applyWords(['FOO']);
            expect(puz.answers.length).toBe(1);
            expect(puz.answers[0].word).toBe('FOO');

            puz = new puzzle.Puzzle(7, -215423);
            puz.applyWords(['GUNK', 'GOOP', 'GRIZ']);
            expect(puz.answers.length).toBe(3);
            expect(puz.answers[0].word).toBe('GUNK');
            expect(puz.answers[1].word).toBe('GOOP');
            expect(puz.answers[2].word).toBe('GRIZ');
        });

        it('generates additional words that fit around the given words', function() {
            var puz = new puzzle.Puzzle(7, -215424);
            puz.applyWords(['GUNK', 'GOOP', 'GRIZ']);
            var gen = new puzgen.Generator(puz);
            gen.generate(5);
            expect(puz.answers.length).toBe(5);
            expect(puz.answers[0].word).toBe('GUNK');
            expect(puz.answers[1].word).toBe('GOOP');
            expect(puz.answers[2].word).toBe('GRIZ');
            // generated words         
            expect(puz.answers[3].word).toBe('EASED');
            expect(puz.answers[4].word).toBe('HEARD');
        });

        it('does nothing if you generate() fewer words than you fed in', function() {
            var puz = new puzzle.Puzzle(7, -215423);
            puz.applyWords(['GUNK', 'GOOP', 'GRIZ']);
            var gen = new puzgen.Generator(puz);
            gen.generate(2);
            expect(puz.answers.length).toBe(3);
        });

        it('fails if a word is too long for the grid', function() {
            expect(()=>{
                puz = new puzzle.Puzzle(4, -215423);
                puz.applyWords(['GUNK', 'GOOP', 'GRIZ', 'TWIZZLE' ]);
                expect(puz.size).toBe(7);
            }).toThrowError(puzzle.PuzzleConflictError);
        });

        it('fails if it can\'t fit a word due to crowding', function() {
            expect(()=>{
                var puz = new puzzle.Puzzle(7, -215423);
                puz.applyWords(['GUNK', 'GOOP', 'GRIZ', 'SPOONY', 'TWIZZLE', 'FIDDLE', 'HANKER']);
            }).toThrowError(puzzle.PuzzleConflictError);
        });
    });

    describe('generate by density', function() {
        it('keeps adding words until a set percentage of the grid is occupied', function() {
            var puz = puzzle.makeFromParameters(7, 0.40, null, -215428);
            expect(puz.density()).toBeGreaterThan(0.40);
            expect(puz.density()).toBeLessThan(0.50);
            expect(puz.answers.length).toBe(5);

            var puz = puzzle.makeFromParameters(7, 0.70, null, -215428);
            expect(puz.density()).toBeGreaterThan(0.70);
            expect(puz.density()).toBeLessThan(0.80);
            expect(puz.answers.length).toBe(9);
        });

        it('doesn\'t freak when 0 density is passed', function() {
            var puz = puzzle.makeFromParameters(7, 0, null, -215428);
            expect(puz.density()).toBeGreaterThan(0);
            expect(puz.answers.length).toBe(1);
        });
    });

    describe('generate by word length factor', function() {
        it('sets min/max word length as a function of grid size', function() {
            var seed = 1485726966758;
            var puz = puzzle.makeFromParameters(7, 0.67, 0.0, seed);
            expect(puz.words.reduce((a,b)=>{return Math.min(a, b.length);}, 99)).toBe(4);
            expect(puz.words.reduce((a,b)=>{return Math.max(a, b.length);}, 0)).toBe(4);

            puz = puzzle.makeFromParameters(7, 0.67, 0.5, seed);
            expect(puz.words.reduce((a,b)=>{return Math.min(a, b.length);}, 99)).toBe(4);
            expect(puz.words.reduce((a,b)=>{return Math.max(a, b.length);}, 0)).toBe(7);

            puz = puzzle.makeFromParameters(7, 0.67, 1.0, seed);
            expect(puz.words.reduce((a,b)=>{return Math.min(a, b.length);}, 99)).toBe(7);
            expect(puz.words.reduce((a,b)=>{return Math.max(a, b.length);}, 0)).toBe(7);
        });
    });

    describe('GenStatKeeper', function() {
        it('tracks error stats for a Generator', function() {
            var puz = new puzzle.Puzzle(6, 35134);
            var gen = new puzgen.Generator(puz);
            gen.statKeeper = new puzgen.GenStatKeeper();
            gen.generate(.60, .40);
            expect(gen.statKeeper.params).toEqual([{
                size:6, seed:35134, a:0.6, b:0.4
            }]);
            expect(gen.statKeeper.times.length).toBe(1); // we don't really care what the time was.
            expect(gen.statKeeper.stats.rackNoGap.length).toBe(13);
        });

        it('accumulates stats across multiple runs/failures', function() {
            var stk = new puzgen.GenStatKeeper();
            var puz = new puzzle.Puzzle(6, 35134);
            var gen = new puzgen.Generator(puz);
            gen.statKeeper = stk;
            gen.generate(.60, .40);

            puz = new puzzle.Puzzle(8, -12657);
            gen = new puzgen.Generator(puz);
            gen.statKeeper = stk;
            gen.generate(6);

            expect(gen.statKeeper.params).toEqual([
                { size:6, seed:35134, a:0.6, b:0.4 },
                { size:8, seed:-12657, a:6, b:undefined }
            ]);
            expect(gen.statKeeper.times.length).toBe(2); // we don't really care what the time was.
            expect(gen.statKeeper.stats.rackNoGap.length).toBe(14);
        });

    });
});
