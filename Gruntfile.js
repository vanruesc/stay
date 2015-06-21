"use strict";

module.exports = function(grunt)
{
  // Project configuration.
  grunt.initConfig({
    license: require("fs").readFileSync("LICENSE").toString(),
    pkg: grunt.file.readJSON("package.json"),

    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      gruntfile: {
        src: "Gruntfile.js"
      },
      lib: {
        src: ["src/**/*.js"]
      }
    },

    browserify: {
      build: {
        src: ["src/<%= pkg.name %>.js"],
        dest: "build/<%= pkg.name %>.js",
        options: {
          banner: "/**\n * <%= pkg.name %> build <%= grunt.template.today(\"dd.mm.yyyy\") %>\n *\n<%= license %>\n */\n",
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
          "build/<%= pkg.name %>.min.js": ["<%= browserify.build.dest %>"]
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
        tasks: ["jshint:lib"]
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");

  // Default task.
  grunt.registerTask("default", ["jshint", "browserify", "uglify"]);
  grunt.registerTask("build", ["browserify", "uglify"]);
};
