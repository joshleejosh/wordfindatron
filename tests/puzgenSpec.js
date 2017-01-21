describe('Test puzgen', function(){
    var Random = require('random-js');
    var data = require('../src/model/data');
    var grid = require('../src/model/grid');
    var puzzle = require('../src/model/puzzle');
    var conflictscan = require('../src/model/conflictscan');
    var puzgen = require('../src/model/puzgen');

    describe('fitWord()', function() {
        beforeEach(function() {
            this.rng = Random.engines.mt19937();
            this.rng.seed(-45123424);
        });

        it('safely rejects empty arguments', function() {
            expect(puzgen.fitWord(this.rng)).toBe(-1);
            expect(puzgen.fitWord(this.rng, '', '')).toBe(-1);
            expect(puzgen.fitWord(this.rng, 'BAR', '')).toBe(-1);
            expect(puzgen.fitWord(this.rng, '', '   ')).toBe(-1);
        });

        it('can place words into a blank rack', function() {
            expect(puzgen.fitWord(this.rng, 'BAR', '  ')).toBe(-1); // too short
            expect(puzgen.fitWord(this.rng, 'BAR', '   ')).toBe(0);
            // offsets are starting to get seed dependent
            expect(puzgen.fitWord(this.rng, 'BAR', '    ')).toBe(0);
            expect(puzgen.fitWord(this.rng, 'BAR', '     ')).toBe(0);
            expect(puzgen.fitWord(this.rng, 'BAR', '      ')).toBe(2);
            expect(puzgen.fitWord(this.rng, 'BAR', '       ')).toBe(0);
        });

        it('can fit words around existing letters in a rack', function() {
            expect(puzgen.fitWord(this.rng, 'BAR', 'B  ')).toBe(0);
            expect(puzgen.fitWord(this.rng, 'BAR', ' A ')).toBe(0);
            expect(puzgen.fitWord(this.rng, 'BAR', '  R')).toBe(0);
            expect(puzgen.fitWord(this.rng, 'BAR', 'X  R ')).toBe(1);
            expect(puzgen.fitWord(this.rng, 'BAR', ' F ')).toBe(-1);
        });
    });

    describe('makeAnswer()', function() {
        beforeEach(function() {
            this.puz = new puzzle.Puzzle(6, 54321);
        });

        it('places a word into the grid and turns it into an answer', function() {
            expect(puzgen.makeAnswer(this.puz, 'GRUNT').word).toBe('GRUNT');
            expect(puzgen.makeAnswer(this.puz, 'FUNK').word).toBe('FUNK');
            expect(puzgen.makeAnswer(this.puz, 'PARTY').word).toBe('PARTY');
        });

        it('freaks out when it can\'t fit a word', function() {
            expect(()=>{ return puzgen.makeAnswer(this.puz, 'TOOLONGWORD'); }).toThrowError();
            puzgen.makeAnswer(this.puz, 'GRUNT');
            puzgen.makeAnswer(this.puz, 'FUNK');
            puzgen.makeAnswer(this.puz, 'PARTY');
            expect(()=>{ return puzgen.makeAnswer(this.puz, 'BADWORD'); }).toThrowError();
        });
    });

    describe('constructing with pre-set words', function() {
        it('puts the words in the grid and turns them into answers', function() {
            var puz = new puzzle.Puzzle(7, -215423, []);
            expect(puz.answers.length).toBe(0);

            puz = new puzzle.Puzzle(7, -215423, ['FOO']);
            expect(puz.answers.length).toBe(1);
            expect(puz.answers[0].word).toBe('FOO');

            puz = new puzzle.Puzzle(7, -215423, ['GUNK', 'GOOP', 'GRIZ']);
            expect(puz.answers.length).toBe(3);
            expect(puz.answers[0].word).toBe('GUNK');
            expect(puz.answers[1].word).toBe('GOOP');
            expect(puz.answers[2].word).toBe('GRIZ');
        });

        it('generates around the given words', function() {
            puz = new puzzle.Puzzle(7, -215423, ['GUNK', 'GOOP', 'GRIZ']);
            puz.generate(5);
            expect(puz.answers[0].word).toBe('GUNK');
            expect(puz.answers[1].word).toBe('GOOP');
            expect(puz.answers[2].word).toBe('GRIZ');
            // generated words         
            expect(puz.answers[3].word).toBe('PIZZA');
            expect(puz.answers[4].word).toBe('LAST');
            //expect(puz.grid.toString()).toBe('URZKDDR\nRIGIDLY\nVEOPRZM\nKUOVYGU\nSNPILOT\nTKUZXYB\nYOVGLPY\n');
        });

        it('does nothing if you generate() fewer words than you fed in', function() {
            puz = new puzzle.Puzzle(7, -215423, ['GUNK', 'GOOP', 'GRIZ']);
            puz.generate(2);
            expect(puz.answers.length).toBe(3);
        });

        it('increases grid size if there isn\'t room for the given words', function() {
            puz = new puzzle.Puzzle(4, -215423, ['GUNK', 'GOOP', 'GRIZ', 'TWIZZLE' ]);
            expect(puz.size).toBe(7);
        });

        it('freaks out when it can\'t fit a word', function() {
            expect(()=>{
                return new puzzle.Puzzle(7, -215423,
                    ['GUNK', 'GOOP', 'GRIZ', 'SPOONY', 'TWIZZLE', 'FIDDLE', 'HANKER']);
            }).toThrowError(puzzle.PuzzleConflictError);
        });
    });

    describe('generate by density', function() {
        it('keeps adding words until a set percentage of the grid is occupied', function() {
            puz = new puzzle.Puzzle(7, -215424);
            puz.generate(0.40);
            expect(puz.density()).toBeGreaterThan(0.40);
            expect(puz.density()).toBeLessThan(0.50);
            expect(puz.answers.length).toBe(5);

            puz = new puzzle.Puzzle(7, -215424);
            puz.generate(0.70);
            expect(puz.density()).toBeGreaterThan(0.70);
            expect(puz.density()).toBeLessThan(0.80);
            expect(puz.answers.length).toBe(8);
        });

        it('doesn\'t freak when 0 density is passed', function() {
            puz = new puzzle.Puzzle(7, -215424);
            puz.generate(0);
            expect(puz.density()).toBeGreaterThan(0);
            expect(puz.answers.length).toBe(1);
        });
    });

    describe('generate by word length factor', function() {
        it('sets min/max word length as a function of grid size', function() {
            puz = new puzzle.Puzzle(7, -215423);
            puz.generate(0.67, 0.0);
            expect(puz.words.reduce((a,b)=>{return Math.min(a, b.length);}, 99)).toBe(4);
            expect(puz.words.reduce((a,b)=>{return Math.max(a, b.length);}, 0)).toBe(4);

            puz = new puzzle.Puzzle(7, -215422);
            puz.generate(0.67, 0.5);
            expect(puz.words.reduce((a,b)=>{return Math.min(a, b.length);}, 99)).toBe(4);
            expect(puz.words.reduce((a,b)=>{return Math.max(a, b.length);}, 0)).toBe(7);

            puz = new puzzle.Puzzle(7, -215422);
            puz.generate(0.67, 1.0);
            expect(puz.words.reduce((a,b)=>{return Math.min(a, b.length);}, 99)).toBe(7);
            expect(puz.words.reduce((a,b)=>{return Math.max(a, b.length);}, 0)).toBe(7);
        });
    });

});
