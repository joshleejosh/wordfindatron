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

        copy: {
            dist: {
                files: [
                    {expand:true, src:['./data/*'], dest:'dist'},
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('build',['browserify:dev', 'sass']);
    grunt.registerTask('dist',['clean', 'browserify:dist', 'sass', 'copy:dist']);
    grunt.registerTask('test',['nodeunit:all']);
    grunt.registerTask('hint',['jshint:all']);
    grunt.registerTask('default',['build']);

}
