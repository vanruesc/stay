module.exports = function(grunt) {

	grunt.initConfig({

		name: "stay",

		date: grunt.template.today("mmm dd yyyy"),
		pkg: grunt.file.readJSON("package.json"),

		banner: "/**\n" +
			" * <%= name %> v<%= pkg.version %> build <%= date %>\n" +
			" * <%= pkg.homepage %>\n" +
			" * Copyright <%= date.slice(-4) %> <%= pkg.author.name %>, <%= pkg.license %>\n" + 
			" */\n",

		jshint: {
			options: {
				jshintrc: true
			},
			files: ["Gruntfile.js", "src/**/*.js", "test/**/*.js"]
		},

		rollup: {
			options: {
				format: "iife",
				moduleName: "<%= name.toUpperCase() %>",
				banner: "<%= banner %>",
				plugins: [
					require("rollup-plugin-npm")({
						jsnext: true
					})
				]
			},
			dist: {
				src: "src/<%= name %>.js",
				dest: "build/<%= name %>.js"
			}
		},

		uglify: {
			options: {
				banner: "<%= banner %>"
			},
			dist: {
				files: {
					"build/<%= name %>.min.js": ["build/<%= name %>.js"]
				}
			}
		},

		mocha: {
			test: {
				src: ["test/**/*.html"],
				options: {
					run: true
				}
			}
		},

		yuidoc: {
			compile: {
				name: "<%= name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",
				options: {
					paths: "src",
					outdir: "docs"
				}
			}
		},

		watch: {
			files: ["<%= jshint.files %>"],
			tasks: ["jshint"]
		}

	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-yuidoc");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-rollup");
	grunt.loadNpmTasks("grunt-mocha");

	grunt.registerTask("default", ["jshint", "build", "uglify", "mocha"]);
	grunt.registerTask("build", ["rollup"]);
	grunt.registerTask("test", ["jshint", "mocha"]);

};
