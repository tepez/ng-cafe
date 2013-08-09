'use strict';
/* jslint camelcase: false */

//var path = require('path');
//var fs = require('fs');
//var glob = require('glob');
//var Minimatch = require("minimatch").Minimatch;

//var remote = require('./node_modules/protractor/node_modules/selenium-webdriver/remote');


module.exports = function (grunt) {

    /**
     * Load in our build configuration file.
     */
    var userConfig = require('./config/build.config.js');

    /**
     * Load user custom grunt task definitions
     */

    //var userTasks = require('<%= folders.config %>/build.tasks.js');
    grunt.file.expand('./config/**/*.task.js').forEach(
        function(file){
            require(file)(grunt);
            file = file.substring(file.lastIndexOf('/')+1, file.indexOf('.task.js'));
            grunt.verbose.writeln('\x1b[33m============= \x1b[36mLoaded custom grunt task \x1b[0m[\x1b[32;1m' + file + '\x1b[0m]');
        }
    );


    /******************************************************************************
     *
     * This is the configuration object Grunt uses to give each plugin its instructions.
     *
     ******************************************************************************/
    var taskConfig = {

        /**
         * We read in our `package.json` file so we can access the package name and
         * version. It's already there, so we don't repeat ourselves here.
         */
        pkg: grunt.file.readJSON('package.json'),

        /**
         * The banner is the comment that is placed at the top of our compiled
         * source files. It is first processed as a Grunt template, where the `<%=`
         * pairs are evaluated based on this very configuration object.
         */
        meta: {
            banner: '/**\n' +
                ' * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                ' * <%= pkg.homepage %>\n' +
                ' *\n' +
                ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
                ' * Licensed <%= pkg.licenses.type %> <<%= pkg.licenses.url %>>\n' +
                ' */\n'
        },

        /**
         * Creates a changelog on a new version.
         */
        changelog: {
            options: {
                dest: '<%= folders.docs %>/CHANGELOG.md',
                template: '<%= folders.config %>/changelog.tpl',
                github: '<%= pkg.repository.url %>',
                version: '<%= pkg.version %>'
            }
        },

        /*
         browser dependency manager.  Download frameworks and libraries that used by the browser.
         This is different than npm package manager used for build and dev tools.
         use :  grunt bower
         this depends on the component packages having a properly formatted bower.json file with a 'main' attribute
         set to the list of files that are necessary for deployment.
         If the library you are useing does not have a properly formmatted bower.json file then you must override
         the export functionality in your bower.json to identify which library files you want copied to your project.
         */
        bower: {
            install: {
                //just run 'grunt bower:install' and you'll see files from your Bower packages in lib directory
                options: {
                    install: true,
                    cleanTargetDir: true,
                    cleanBowerDir: true,
                    layout: 'byComponent',
                    targetDir: 'vendor',
                    verbose: true
                }
            }
        },

        shell: {
            options: {
                failOnError: false,
                stderr: true,
                stdout: true
            },
            bower_prune: {
                command: 'node_modules/bower/bin/bower prune --verbose'
            },
            kill_phantom: {
                command: [
                    '(ps -eo pid,command | grep "phantomjs" | grep -v "grep")',
                    '(ps -eo pid,command | grep "phantomjs" | grep -v "grep" | awk "{ print $1 }" | xargs kill -9 )'
                ].join('&&')
            },
            kill_unit: {
                command: '(lsof -P | grep <%= karma.unit.port %>) && (time lsof -P | grep <%= karma.unit.port %> | awk "{print $2}" | xargs echo | sed "s/ /, /g" | xargs kill -9 2&>1 /dev/null)'
            },
            kill_midway: {
                command: '(lsof -P | grep <%= karma.midway.port %>) && (time lsof -P | grep <%= karma.unit.port %> | awk "{print $2}" | xargs echo | sed "s/ /, /g" | xargs kill -9 2&>1 /dev/null)'
            },
            kill_e2e: {
                command: '(lsof -P | grep <%= karma.e2e.port %>) && (time lsof -P | grep <%= karma.unit.port %> | awk "{print $2}" | xargs echo | sed "s/ /, /g" | xargs kill -9 2&>1 /dev/null)'
            },
            install_selenium: {
                command: './node_modules/protractor/bin/install_selenium_standalone'
            },
            start_selenium: {
                command: 'java -jar selenium/selenium-server-standalone-2.33.0.jar -Dwebdriver.chrome.driver=./selenium/chromedriver 2> /dev/null :3 &'
            },
            stop_selenium: {
                command: 'curl "http://localhost:4444/selenium-server/driver/?cmd=shutDownSeleniumServer"'
            }
        },

        /**
         * Increments the version number, etc.
         */
        bump: {
            options: {
                files: [
                    'package.json',
                    'bower.json'
                ],
                commit: false,
                commitMessage: 'chore(release): v%VERSION%',
                commitFiles: [
                    'package.json',
                    'bower.json'
                ],
                createTag: false,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'origin'
            }
        },


        /**
         * The directories to delete when `grunt clean` is executed.
         */
        clean: {
            build: ['<%= folders.build %>'],
            compile: ['<%= folders.compile %>']
        },

        /**
         * The `copy` task just copies files from A to B. We use it here to copy
         * our project assets (images, fonts, etc.) and javascripts into
         * `folders.build`, and then to copy the assets to `folders.compile`.
         */
        copy: {

            build_assets: {
                files: [
                    {
                        src: ['**', '!README.md'],
                        dest: '<%= folders.build %>/assets/',
                        cwd: '<%= folders.assets %>',
                        expand: true
                    },
                    {
                        src: [ 'favicon.ico' ],
                        dest: '<%= folders.build %>',
                        cwd: '<%= folders.assets %>',
                        expand: true
                    }
                ]
            },

            build_appjs: {
                files: [
                    {
                        src: [ '<%= files.app.js %>' ],
                        dest: '<%= folders.build %>/',
                        cwd: '.',
                        expand: true
                    }
                ]
            },

            build_vendorjs: {
                files: [
                    {
                        src: [ '<%= files.vendor.js %>' ],
                        dest: '<%= folders.build %>/',
                        cwd: '.',
                        expand: true
                    }
                ]
            },

            build_vendorcss: {
                files: [
                    {
                        src: ['<%= files.vendor.css %>'],
                        dest: '<%= folders.build %>/',
                        cwd: '.',
                        expand: true
                    }
                ]
            },

            compile_assets: {
                files: [
                    {
                        src: [ '**' ],
                        dest: '<%= folders.compile %>/assets',
                        cwd: '<%= folders.build %>/assets',
                        expand: true
                    }
                ]
            }
        },

        /**
         * `grunt concat` concatenates multiple source files into a single file.
         */
        concat: {
            /**
             * The `folders.compile` target is the concatenation of our application source code
             * into a single file. All files matching what's in the `src.js`
             * configuration property above will be included in the final build.
             *
             * In addition, the source is surrounded in the blocks specified in the
             * `module.prefix` and `module.suffix` files, which are just run blocks
             * to ensure nothing pollutes the global namespace.
             *
             * The `options` array allows us to specify some customization for this
             * operation. In this case, we are adding a banner to the top of the file,
             * based on the above definition of `meta.banner`. This is simply a
             * comment with copyright information.
             */
            compile_js: {
                options: {
                    banner: '<%= meta.banner %>'
                },
                src: [
                    '<%= files.vendor.js %>',
                    '<%= folders.config %>/module.prefix',
                    '<%= folders.build %>/src/**/*.js',
                    '<%= html2js.app.dest %>',
                    '<%= html2js.common.dest %>',
                    '<%= folders.config %>/module.suffix'
                ],
                dest: '<%= folders.compile %>/assets/<%= pkg.name %>.js'
            }
        },

        /**
         * `grunt coffee` compiles the CoffeeScript sources. To work well with the
         * rest of the build, we have a separate compilation task for sources and
         * specs so they can go to different places. For example, we need the
         * sources to live with the rest of the copied JavaScript so we can include
         * it in the final build, but we don't want to include our specs there.
         */
        coffee: {
            source: {
                options: {
                    bare: true,
                    sourceMap: true
                },
                expand: true,
                cwd: '.',
                src: [ '<%= files.app.coffee %>' ],
                dest: '<%= folders.build %>',
                ext: '.js'
            }
        },

        /**
         * `ng-min` annotates the sources before minifying.
         * That is, it allows us to code without the angular injection array syntax.
         */
        ngmin: {
            compile: {
                files: [
                    {
                        src: [ '<%= files.app.js %>' ],
                        cwd: '<%= folders.build %>',
                        dest: '<%= folders.build %>',
                        expand: true
                    }
                ]
            }
        },

        ngdocs: {
            /**
             * Basic ngdocs configuration. Contains a temporary `site_tmp` folder which
             * gets later committed to gh-pages branch. The nav-template modifies the standard
             * ngdocs navigation template to add additional markup for example.
             *
             * html5Mode controls if pushState is active or not. We set this to `false` by default
             * to make sure the generated site works well on github pages without routing
             * problems.
             *
             * `styles` let you manipulate the basic styles that come with ngdocs, we made
             * the font-sizes in particular cases a bit smaller so that everything looks
             * nice.
             *
             * `api`, `guide` and `tutorial` configure the certain sections. You could either
             * declare some source files as `src` which contain ngdoc comments, or simply
             * *.ngdoc files which also get interpreted as ngdoc files.
             */
            options: {
                dest: 'site_tmp',
                title: '<%= pkg.name %>',
                navTemplate: '<%= folders.docs %>/html/navigation.html',
                html5Mode: false,
                startPage: '/guide',
                styles: ['<%= folders.docs %>/css/styles.css']
            },

            /*
             * API section configuration. Defines source files and a section title.
             */
            api: {
                src: ['<%= files.app.js %>', '<%= folders.docs %>/content/api/*.ngdoc'],
                title: 'API Reference'
            },

            /*
             * Guide section configuration. Defines source files and a section title.
             */
            guide: {
                src: ['<%= folders.docs %>/content/guide/*.ngdoc'],
                title: 'Guide'
            },
            /*
             * Tutorial section configuration. Defines source files and a section title.
             */
            tutorial: {
                src: ['<%= folders.docs %>/content/tutorial/*.ngdoc'],
                title: 'Tutorial'
            }
        },

        /**
         * Minify the concatenated sources!
         */
        uglify: {
            compile: {
                options: {
                    banner: '<%= meta.banner %>'
                },
                files: {
                    '<%= concat.compile_js.dest %>': '<%= concat.compile_js.dest %>'
                }
            }
        },

        /**
         * `recess` handles our LESS compilation and uglification automatically.
         * Only our `main.less` file is included in compilation; all other files
         * must be imported from this file.
         * Default configuration values;
         * compile: false              // Compiles CSS or LESS. Fixes white space and sort order.
         * compress: false             // Compress your compiled code
         * noIDs: true                 // Doesn't complain about using IDs in your stylesheets
         * noJSPrefix: true            // Doesn't complain about styling .js- prefixed classnames
         * noOverqualifying: true      // Doesn't complain about overqualified selectors (ie: div#foo.bar)
         * noUnderscores: true         // Doesn't complain about using underscores in your class names
         * noUniversalSelectors: true  // Doesn't complain about using the universal * selector
         * prefixWhitespace: true      // Adds whitespace prefix to line up vender prefixed properties
         * strictPropertyOrder: true   // Complains if not strict property order
         * zeroUnits: true             // Doesn't complain if you add units to values of 0
         */
        recess: {
            build: {
                src: [ '<%= files.less %>' ],
                dest: '<%= folders.build %>/assets/<%= pkg.name %>.css',
                options: {
                    compile: true,
                    compress: false,
                    noUnderscores: false,
                    noIDs: false,
                    zeroUnits: false
                }
            },
            compile: {
                src: ['<%= recess.build.dest %>' ],
                dest: '<%= recess.build.dest %>',
                options: {
                    compress: true
                }
            }
        },

        /**
         * `jshint` defines the rules of our linter as well as which files we
         * should check. This file, all javascript sources, and all our tests
         * are linted based on the policies listed in `options`. But we can also
         * specify exclusionary patterns by prefixing them with an exclamation
         * point (!); this is useful when code comes from a third party but is
         * nonetheless inside `src/`.
         */
        jshint: {

            options: {
                jshintrc: '<%= folders.config %>/jshint.json'
            },

            src: {
                files: {
                    src: ['<%= files.app.js %>']
                }
            },

            test: {
                files: {
                    src: [
                        '<%= files.test.unit.js %>',
                        '<%= files.test.midway.js %>',
                        '<%= files.test.e2e.js %>'
                    ]
                }
            },

            gruntfile: {
                files: {
                    src: ['Gruntfile.js']
                }
            },

            buildconf: {
                files: {
                    src: ['<%= folders.config %>/build.config.js']
                }
            }
        },

        /**
         * express-server instance, by default listening to port 9000
         */
        express: {
            /**
             * express server instance for unit tests.
             */
            test: {
                options: {
                    port: 9200,
                    hostname: 'localhost',
                    bases: ['<%= folders.build %>']
                }
            },

            /**
             * express server instance for unit tests.
             */
            e2e: {
                options: {
                    port: 9300,
                    hostname: 'localhost',
                    bases: ['<%= folders.build %>']
                }
            },

            livereload: {
                options: {
                    livereload: true,
                    port: 9400,
                    hostname: 'localhost', // '*',  change this to '0.0.0.0' to access the server from outside
                    bases: [ userConfig.folders.build ]
                }
            }
        },

        /**
         * `coffeelint` does the same as `jshint`, but for CoffeeScript.
         */
        coffeelint: {
            options: {
                configFile: '<%= folders.config %>/coffeelint.json'
            },
            src: {
                nonull: true,
                expand: true,
                files: [
                    {src: [ '<%= files.app.coffee %>']}
                ]
            },
            test: {
                nonull: true,
                expand: true,
                files: [
                    {src: ['<%= files.test.unit.coffee %>']},
                    {src: ['<%= files.test.midway.coffee %>']},
                    {src: ['<%= files.test.e2e.coffee %>']}
                ]
            }
        },

        /**
         * HTML2JS is a Grunt plugin that takes all of your template files and
         * places them into JavaScript files as strings that are added to
         * AngularJS's template cache. This means that the templates too become
         * part of the initial payload as one JavaScript file. Neat!
         */
        html2js: {
            /**
             * These are the templates from `src/app`.
             */
            app: {
                options: {
                    base: 'src/app'
                },
                src: [ '<%= files.templates.app %>' ],
                dest: '<%= folders.build %>/templates-app.js'
            },

            /**
             * These are the templates from `src/common`.
             */
            common: {
                options: {
                    base: 'src/common'
                },
                src: ['<%= files.templates.common %>'],
                dest: '<%= folders.build %>/templates-common.js'
            }
        },


        // use gunt-usemin

        /**
         * The `index` task compiles the `index.html` file as a Grunt template. CSS
         * and JS files co-exist here but they get split apart later.
         * With this method you specify your application sources in the build.config.js file.
         * These identified (minimatch/glob) source files are inserted into script tags in
         * the index.html file.  The css files are inserted into style tags in the index.html.
         *
         * Another option is to use the usemin task.  With usemin you identify specific resources
         * manually in the index.html, but you can wrap specific groups of scripts and css files
         * in html comment directives to identify which groups to concatenate for the final product.
         * When compile the distribution source these groups are compressed into single files and the
         * script tags are replaced with references to the single files.
         *
         * You will still need to identify the folders and source patterns in the build.config.js
         * for the rest of the build system to manage.  grunt-usemin provides more flexability
         * in how you package your sources, but you are required to maange the individual script/css
         * tag inclusions in the main app index.html files.
         */
        index: {

            /**
             * During development, we don't want to have wait for compilation,
             * concatenation, minification, etc. So to avoid these steps, we simply
             * add all script files directly to the `<head>` of `index.html`. The
             * `src` property contains the list of included files.
             */
            build: {
                dest: '<%= folders.build %>',
                src: [
                    '<%= files.vendor.js %>',
                    '<%= folders.build %>/src/**/*.js',
                    '<%= html2js.common.dest %>',
                    '<%= html2js.app.dest %>',
                    '<%= files.vendor.css %>',
                    '<%= recess.build.dest %>'
                ]
            },

            /**
             * When it is time to have a completely compiled application, we can
             * alter the above to include only a single JavaScript and a single CSS
             * file. Now we're back!
             */
            compile: {
                dest: '<%= folders.compile %>',
                src: [
                    '<%= concat.compile_js.dest %>',
                    '<%= recess.compile.dest %>'
                ]
            }
        },

        open: {// open browser to hosted location
            server: { url: 'http://localhost:9400' }
        },

        /* configurations for protractor functional tests (e2e) */
        protractor: {

        },

        simplemocha: {
            options: {
                globals: ['should', 'expect', 'assert'],
                timeout: 3000,   // timeout in milliseconds
                ignoreLeaks: false,  // ignore global leaks
                //grep: '*-test',   // string or regexp to filter tests with
                ui: 'bdd',  // name "bdd", "tdd", "exports" etc
                reporter: 'tap',  // reporter instance, defaults to `mocha.reporters.Dot`
                //bail: true, // bail on the first test failure, default = true
                slow: 30000 // milliseconds to wait before considering a test slow
            },

            e2e: {
                src: ['src/test/e2e/**/*.mocha.coffee']
            }
        },


        tests: {
            common: {
                files: [
                    {pattern: '<%= files.vendor.js %>', watched: false},
                    {pattern: '<%= html2js.app.dest %>', watched: true},
                    {pattern: '<%= html2js.common.dest %>', watched: true},
                    {pattern: '<%= files.app.js %>', watched: true},
                    {pattern: '<%= files.app.coffee %>', watched: true}
                ]
            },
            unit: {
                port: 9010,
                files: [
                    {pattern: 'vendor/angular-mocks/index.js', watched: false},
                    {pattern: 'node_modules/sinon/pkg/sinon.js', watched: false},
                    '<%= files.test.unit.js %>',
                    '<%= files.test.unit.coffee %>'
                ]
            },
            midway: {
                port: 9020,
                files: [
                    {pattern: 'vendor/ngMidwayTester/Source/ngMidwayTester.js', watched: false},
                    {pattern: 'node_modules/sinon/pkg/sinon.js', watched: false},
                    '<%= files.test.midway.js %>',
                    '<%= files.test.midway.coffee %>'
                ]
            },
            e2e: {
                port: 9030, // server listening on port
                files: [
                    {pattern: 'node_modules/protractor/node_modules/selenium-webdriver/index.js', watched: false},
                    {pattern: 'node_modules/protractor/lib/protractor.js', watched: false},
                    '<%=folders.test.test %>/functionalTestBase.coffee',
                    '<%= files.test.e2e.js %>',
                    '<%= files.test.e2e.coffee %>'
                ]
            }
        },

        /**
         * The Karma options.
         *
         * The list of browsers to launch to test on. This includes only "Firefox" by
         * default, but other browser names include:
         * Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS

         * basePath From where to look for files, starting with the location of karma config file.
         *
         * port: On which port should the browser connect,
         * runnerPort: on which port is the test runner operating
         * rootUrl:  and what is the URL path for the browser to use.
         */

        karma: {
            options: {
                basePath: '.', // project root relative to karma.config file, prepend to all file paths
                urlRoot: '/',    // how to get to this app from the browser

                hostname: 'localhost',

                browsers: [ 'PhantomJS'], // Chrome, ChromeCanary, Firefox, Opera, Safari, PhantomJS

                background: true,
                singleRun: false,
                autoWatch: false,

                loggers: [
                    {type: 'console'}
                ],
                logLevel: 'WARN',
                colors: true,

                reporters: ['spec'], // 'dots','progress', ['list', 'tap' for mocha]
                reportSlowerThan: 500,
                captureTimeout: 5000,

                frameworks: ['mocha', 'chai', 'chai-as-promised', 'sinon-chai'], // mocha, jasmine, ng-scenario

                plugins: [
                    //'karma-jasmine',
                    'karma-mocha',
                    'karma-chai',
                    'karma-coverage',
                    'karma-chai-plugins',
                    'karma-spec-reporter',
                    //'karma-ng-scenario', // this is being replaced by protractor
                    //'karma-chrome-launcher',
                    //'karma-firefox-launcher',
                    //'karma-safari-launcher',
                    //'karma-script-launcher',
                    'karma-phantomjs-launcher',
                    'karma-coffee-preprocessor',
                    'karma-html2js-preprocessor',
                    'karma-requirejs'
                ],
                preprocessors: {
                    '**/*.coffee': 'coffee',
                    'src/**/*.js': ['coverage']
                },
                coffeePreprocessor: {
                    options: {
                        sourceMap: true,
                        bare: true
                    }
                },
                coverageReporter: {
                    type: 'html',
                    dir: '<%folders.build%>/coverage/'
                },
                files: '<%= tests.common.files %>'
            },

            unit: {
                port: '<%= tests.unit.port %>',// server listening on port
                files: '<%= tests.unit.files %>'
            },

            ci_unit: {
                port: '<%= tests.unit.port %>',// server listening on port
                files: '<%= tests.unit.files %>',
                singleRun: true,
                background: false
            },

            midway: {
                port: '<%= tests.midway.port %>',// server listening on port
                files: '<%= tests.midway.files %>'
            },

            ci_midway: {
                port: '<%= tests.midway.port %>',// server listening on port
                files: '<%= tests.midway.files %>',
                singleRun: true,
                background: false
            },

            e2e: {
                port: '<%= tests.e2e.port %>',// server listening on port
                files: '<%= tests.e2e.files %>'
            },

            ci_e2e: {
                port: '<%= tests.e2e.port %>',// server listening on port
                files: '<%= tests.e2e.files %>',
                singleRun: true,
                background: false

            }
        },


        /**
         * This task compiles the karma template so that changes to its file array
         * don't have to be managed manually.
         */
        karmaconfig: {
            options: {
                // default application scope files use by all tests.
                patterns: '<%= karma.options.files %>'
            },

            unit: {
                template: '<%= folders.config %>/karma.config.tpl.coffee',
                dest: '<%= folders.build %>/karma.unit.conf.coffee',
                patterns: '<%= karma.unit.files %>'
            },

            midway: {
                template: '<%= folders.config %>/karma.config.tpl.coffee',
                dest: '<%= folders.build %>/karma.midway.conf.coffee',
                patterns: '<%= karma.midway.files %>'

            },

            e2e: {
                template: '<%= folders.config %>/karma.config.tpl.coffee',
                dest: '<%= folders.build %>/karma.e2e.conf.coffee',
                patterns: '<%= karma.e2e.files %>'
            }
        },

        /**
         * And for rapid development, we have a watch set up that checks to see if
         * any of the files listed below change, and then to execute the listed
         * tasks when they do. This just saves us from having to type "grunt" into
         * the command-line every time we want to see what we're working on; we can
         * instead just leave "grunt watch" running in a background terminal. Set it
         * and forget it, as Ron Popeil used to tell us.
         *
         * But we don't need the same thing to happen for all the files.
         */
        delta: {

            /**
             * By default, we want the Live Reload to work for all tasks; this is
             * overridden in some tasks (like this file) where browser resources are
             * unaffected. It runs by default on port 35729, which your browser
             * plugin should auto-detect.
             */
            options: {
                livereload: true
            },

            /**
             * When the Gruntfile changes, we just want to lint it. In fact, when
             * your Gruntfile changes, it will automatically be reloaded!
             */
            gruntfile: {
                files: [ 'Gruntfile.js' ],
                tasks: ['jshint:gruntfile'],
                options: { livereload: false }
            },

            /**
             * When the bower.json changes, we want to lint it and execute bower_install
             * to get any new dependencies
             */
            bowerfile: {
                files: [ 'bower.json' ],
                tasks: ['shell:bower_prune', 'bower'],
                options: { livereload: false }
            },

            /**
             * When the build.conf.js changes, we just want to lint it. In fact, when
             */
            buildconf: {
                files: [ '<%= folders.config %>/build.config.js' ],
                tasks: ['jshint:buildconf'],
                options: { livereload: false }
            },

            /**
             * When our source files change,
             * we want to lint them and run our tests.
             */
            jssrc: {
                files: [ '<%= files.app.js %>' ],
                tasks: ['jshint:src',
                    'karma:unit:run',
                    'karma:midway:run',
                    //'karma:e2e:run',
                    'copy:build_appjs'
                ]
            },

            /**
             * When our CoffeeScript source files change, we want to run lint them and
             * run our unit tests.
             */
            coffeesrc: {
                files: ['<%= files.app.coffee %>'],
                tasks: [ 'coffeelint:src',
                    'coffee:source',
                    'karma:unit:run',
                    'karma:midway:run',
                    //'karma:e2e:run',
                    'copy:build_appjs'
                ]
            },

            /**
             * When assets are changed, copy them. Note that this will *not* copy new
             * files, so this is probably not very useful.
             */
            assets: {
                files: [ '<%= folders.assets %>/**/*' ],
                tasks: [ 'copy:build_assets' ]
            },

            /**
             * When index.html changes, we need to compile it.
             */
            html: {
                files: [ '<%= files.html %>' ],
                tasks: [ 'index:build' ]
            },

            /**
             * When our templates change, we only rewrite the template cache.
             */
            tpls: {
                files: [
                    '<%= files.templates.app %>',
                    '<%= files.templates.common %>'
                ],
                tasks: [ 'html2js' ]
            },

            /**
             * When the CSS files change, we need to compile and minify them.
             */
            less: {
                files: [ '<%=files.less%>' ],
                tasks: [ 'recess:build' ]
            },

            /**
             * When a JavaScript test file changes, we only want to lint it and
             * run the tests. We don't want to do any live reloading.
             */
            jsunit: {
                files: [ '<%= files.test.unit.js %>' ],
                tasks: [ 'jshint:test', 'karma:unit:run' ],
                options: { livereload: false }
            },

            jsmidway: {
                files: [ '<%= files.test.midway.js %>' ],
                tasks: [ 'jshint:test', 'karma:midway:run' ],
                options: { livereload: false }
            },

            jse2e: {
                files: [ '<%= files.test.e2e.js %>' ],
                tasks: [ 'jshint:test'], //, 'karma:e2e:run' ],
                options: { livereload: false }
            },

            /**
             * When a CoffeeScript test file changes, we only want to lint it and
             * run the unit tests. We don't want to do any live reloading.
             */
            coffeeunit: {
                files: [ '<%= files.test.unit.coffee %>' ],
                tasks: [ 'coffeelint:test', 'karma:unit:run' ],
                options: { livereload: false }
            },

            coffeemidway: {
                files: [ '<%= files.test.midway.coffee %>' ],
                tasks: [ 'coffeelint:test', 'karma:midway:run' ],
                options: { livereload: false }
            },

            coffeee2e: {
                files: [ '<%= files.test.e2e.coffee %>' ],
                tasks: [ 'coffeelint:test'],//, 'karma:e2e:run' ],
                options: { livereload: false }
            }
        },

        concurrent: {
            tests: [
                'karma:ci_unit',
                'karma:ci_midway'//,
                //'karma:ci_e2e'
            ]
        }
    };


    /******************************************************************************
     * Load required Grunt tasks. These are installed based on the versions listed
     * in `package.json` when you do `npm install --save-dev` in this directory.
     ******************************************************************************/
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig(grunt.util._.merge(taskConfig, userConfig));

    /******************************************************************************
     *
     * DEFINE TASK ALIASES (groups of tasks run together under an alias target)
     *
     ******************************************************************************/

    /**
     * In order to make it safe to just compile or copy *only* what was changed,
     * we need to ensure we are starting from a clean, fresh build. So we rename
     * the `watch` task to `delta` (that's why the configuration var above is
     * `delta`) and then add a new task called `watch` that does a clean build
     * before watching for changes.
     */
    grunt.renameTask('watch', 'delta');



    /*
     The test servers stay in process as long as the grunt process is running.
     When running with the 'grunt-watch' (renamed 'delta') this holds the grunt process alive forever.
     The build target executes the 'ci' versions of the karma tests, this means they are scheduled for a single run only,
     although the servers are held in processes until the watch process completes.
     This effectively blocks the tests from running a subsequent time when any files change.
     To solve this you MUST run build separately from
     */
    grunt.registerTask('watch', function () {
        grunt.task.run([
            'build',
            'shell:kill_phantom',
            'karma:unit',            // single_run = false
            'karma:midway',          // single_run = false
            //'express:e2e',  // to serve app to e2e tests
            //'karma:e2e',             // acceptance tests
            //'express:livereload',    // allow dev to see ui changes live
            'delta'                  // watch for file changes and trigger build events
        ]);
    });

    /**
     * The `build` task gets your app ready to run for development and testing.
     */
//    grunt.registerTask('e2e', function () {
//        grunt.task.run([ 'express:e2e', 'karma:e2e' ]);
//    });


    /**
     * The default task is to build and compile.
     */
    grunt.registerTask('default', ['init', 'build', 'karma:ci_unit', 'karma:ci_midway', 'compile']);

    grunt.registerTask('test', [ 'reset', 'karma:ci_unit', 'karma:ci_midway' ]);

    grunt.registerTask('dev_server', [ 'open', 'express:livereload', 'express-keepalive']);

    grunt.registerTask('reset', [ 'shell:kill_phantom' ]);

    //The `build` task gets your app ready to run for development and testing.
    grunt.registerTask('build', [ 'quick-build', 'assemble' ]);

    /**
     * quick-build task which gets executed by travis. We have to decouple this one
     * from build task, because travis ci can't handle less etc.
     */
    grunt.registerTask('quick-build', ['clean','html2js','jshint','coffeelint','coffee']);

    grunt.registerTask('assemble',['recess:build','copy:build_assets','copy:build_appjs','copy:build_vendorjs',
        'copy:build_vendorcss', // ??
        'index:build'
    ]);

    /**
     * The `compile` task gets your app ready for deployment by concatenating and
     * minifying your code.
     */
    grunt.registerTask('compile',['recess:compile','copy:compile_assets','ngmin','concat:compile_js',
        'uglify','index:compile'
    ]);

    grunt.registerTask('release', ['changelog']);


};
