gulp = require 'gulp'
coffee = require 'gulp-coffee'
concat = require 'gulp-concat'
uglify = require 'gulp-uglify'
sourcemaps = require 'gulp-sourcemaps'
coffeelint = require 'gulp-coffeelint'

paths =
  source: 'src/**/*.coffee'
  jsDist: 'dist'

gulp.task 'lint', ->
  gulp.src(paths.source)
    .pipe(coffeelint())
    .pipe(coffeelint.reporter())
    .pipe(coffeelint.reporter('fail'))

gulp.task 'build', ['lint'], ->
  gulp.src(paths.source)
    .pipe(coffee({bare: true}))
    .pipe(concat('ng-circular-json.js'))
    .pipe(gulp.dest(paths.jsDist))

gulp.task 'minify', ['build'], ->
  gulp.src(paths.source)
  .pipe(sourcemaps.init())
  .pipe(coffee({bare: true}))
  .pipe(concat('ng-circular-json.min.js'))
  .pipe(uglify())
  .pipe(sourcemaps.write())
  .pipe(gulp.dest(paths.jsDist))

gulp.task 'default', ['build', 'minify']
