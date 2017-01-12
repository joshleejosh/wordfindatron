module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        browserify: {
            dev: {
                options: {
                    debug: true,
                },
                files: {
                    'wordfindatron.js': 'src/main.js'
                }
            },
            dist: {
                options: {
                    debug: false,
                    transform: [ 'uglifyify' ]
                },
                files: {
                    'wordfindatron.js': 'src/main.js',
                }
            },
        },

        sass: {
            all: {
                files: {
                    'wordfindatron.css' : 'wordfindatron.scss'
                }
            }
        },

        concat: {
            wordlists: {
                options: {
                    process: function(src, path) {
                        console.log(path);
                        if (path === 'data/words7.txt') {
                            return '### WORDLIST ###\n' + src;
                        } else {
                            return '### BLACKLIST ###\n' + src;
                        }
                    }
                },
                files:  {
                    'wordlists.txt': [ 'data/words7.txt', 'data/blacklist.txt', 'data/graylist.txt' ]
                }
            }
        },

        copy: {
            dist: {
                files: [
                    {expand:true, src:['./wordlists.txt'], dest:'dist'},
                    {expand:true, src:['./index.html'], dest:'dist/'},
                    {expand:true, src:['./wordfindatron.css'], dest:'dist/'},
                    {expand:true, src:['./wordfindatron.js'], dest:'dist/'},
                ]
            }
        },

        nodeunit: {
            options: {
                reporter: 'default'
            },
            all: [ 'tests' ]
        },

        jshint: {
            options: {
                jshintrc: true,
                force: true
            },
            all: [ 'src' ]
        },

        clean: [
            'wordfindatron.js',
            'wordfindatron.css',
            'wordfindatron.css.map',
            'wordlists.txt',
            'dist/**'
        ],

        watch: {
            css: {
                files: '**/*.scss',
                tasks: ['sass']
            },
            js: {
                files: 'src/*.js',
                tasks: ['browserify:dev']
            },
            options: {
                forever: false
            }
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('build',['browserify:dev', 'sass', 'concat:wordlists']);
    grunt.registerTask('dist',['clean', 'browserify:dist', 'sass', 'concat:wordlists', 'copy:dist']);
    grunt.registerTask('test',['nodeunit:all']);
    grunt.registerTask('hint',['jshint:all']);
    grunt.registerTask('default',['build']);

}
