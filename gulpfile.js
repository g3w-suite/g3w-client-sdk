const path = require('path');
const del = require('del');
const url = require('url');
//Gulp
const gulp   = require('gulp');
const concat = require('gulp-concat');
const streamify = require('gulp-streamify');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const flatten = require('gulp-flatten');
const useref = require('gulp-useref');
const filter = require('gulp-filter');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const chalk = require('chalk');
const watch = require('gulp-watch');
const cleanCSS = require('gulp-clean-css');
const gutil = require("gulp-util");
const less = require('gulp-less');
const jshint = require('gulp-jshint');
const browserify = require('browserify');
const watchify = require('watchify');
const stringify = require('stringify');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');

const production = false;

gulp.task('browserify', [], function(done) {
  const bundler = browserify('./sdk.js', {
      basedir: "./",
      paths: ["./"],
      standalone: 'g3wsdk',
      debug: !production,
      cache: {},
      packageCache: {}
    });
    /*if (!production) {
      bundler = watchify(bundler);
    }*/
    bundler.transform(stringify, {
      global: true,
      appliesTo: { includeExtensions: ['.html'] }
    });
    bundler.bundle()
    .on('error', function(err){
      console.log(err);
      //browserSync.notify(err.message, 3000);
      //browserSync.reload();
      this.emit('end');
      del(['.build/sdk.js']).then(function(){
        process.exit();
      });
    })
    .pipe(source('build.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpif(production, uglify().on('error', gutil.log)))
    .pipe(sourcemaps.write())
    .pipe(rename('sdk.js'))
    .pipe(gulp.dest('./build'));
});


gulp.task('build-sdk', ['browserify']);

gulp.task('default',['build-sdk']);




