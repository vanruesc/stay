"use strict";

module.exports = function(grunt)
{
  // Project configuration.
  grunt.initConfig({
    license: require("fs").readFileSync("LICENSE").toString(),
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
      },
      build: {
        src: ["src/<%= name %>.js"],
        dest: "build/<%= name %>.js",
        options: {
          banner: "/**\n * <%= name %> build <%= grunt.template.today(\"dd.mm.yyyy\") %>\n *\n<%= license %>\n */\n",
          browserifyOptions: {
            standalone: "Stay"
          }
        }
      }
    },

    uglify: {
      build: {
        options: {
          banner: "<%= browserify.build.options.banner %>",
          mangle: {
            except: ["<%= browserify.build.options.browserifyOptions.standalone %>"]
          }
        },
        files: {
          "build/<%= name %>.min.js": ["<%= browserify.build.dest %>"]
        }
      }
    },

    clean: {
      test: ["<%= browserify.test.dest %>"]
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
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");

  // Task definitions.
  grunt.registerTask("default", ["clean:test", "jshint", "browserify:test", "jasmine", "browserify:build", "uglify", "clean:test"]);
  grunt.registerTask("test", ["clean:test", "jshint", "browserify:test", "jasmine", "clean:test"]);
  grunt.registerTask("build", ["browserify:build", "uglify"]);
};
