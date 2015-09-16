module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		pkg: grunt.file.readJSON("package.json"),
		name: "stay",

		jshint: {

			options: {
				jshintrc: ".jshintrc"
			},

			gruntfile: {
				src: "Gruntfile.js"
			},

			lib: {
				src: ["src/**/*.js"]
			},

			test: {
				src: ["test/**/*.js"]
			}

		},

		jasmine: {

			src: [],

			options: {
				outfile: "test/_specrunner.html",
				specs: "<%= browserify.test.dest %>"
			}

		},

		browserify: {

			test: {

				src: ["<%= jshint.test.src %>"],
				dest: "test/specs.js",

				options: {

					browserifyOptions: {
						debug: true,
						paths: ["./node_modules", "./src"]
					}

				}

			}

		},

		usebanner: {

			bundle: {

				options: {
					banner: "/**\n * <%= name %> v<%= pkg.version %> build <%= grunt.template.today(\"dd.mm.yyyy\") %>\n" +
						" * <%= pkg.homepage %>\n" +
						" * Copyright <%= grunt.template.today(\"yyyy\") %> <%= pkg.author.name %>, <%= pkg.license %>\n */\n",
					linebreak: false
				},

				files: {
					src: ["build/<%= name %>.js"]
				}

			}

		},

		uglify: {

			build: {

				options: {
					banner: "<%= usebanner.bundle.options.banner %>"
				},

				files: {
					"build/<%= name %>.min.js": "<%= usebanner.bundle.files.src %>"
				}

			}

		},

		clean: {
			test: ["<%= browserify.test.dest %>"]
		},

		yuidoc: {

			compile: {

				name: "<%= name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",

				options: {
					paths: ["./src/"],
					outdir: "docs"
				}

			}

		},

		watch: {

			gruntfile: {
				files: "<%= jshint.gruntfile.src %>",
				tasks: ["jshint:gruntfile"]
			},

			lib: {
				files: "<%= jshint.lib.src %>",
				tasks: ["jshint:lib", "browserify:test", "jasmine"]
			},

			test: {
				files: "<%= jshint.test.src %>",
				tasks: ["jshint:test", "browserify:test", "jasmine"]
			}

		}

	});

	// Plugins.
	grunt.loadNpmTasks("grunt-banner");
	grunt.loadNpmTasks("grunt-browserify");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-jasmine");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-yuidoc");

	// Task definitions.
	grunt.registerTask("default", ["clean:test", "jshint", "browserify:test", "jasmine", "uglify", "usebanner", "clean:test"]);
};
