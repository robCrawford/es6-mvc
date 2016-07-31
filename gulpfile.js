"use strict";

let gulp = require('gulp'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    babelify = require('babelify'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    del = require('del'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    less = require('gulp-less'),
    cleanCSS = require('gulp-clean-css'),
    watch = require('gulp-watch'),
    tap = require('gulp-tap');

let config = {
        buildType: 'dev',
        cleanFlag: false
    };


/*
  Top level tasks
*/
gulp.task('default', ['dev', 'watch']);
gulp.task('dev', ['init.dev', 'html', 'vendor', 'js', 'css', 'test']);
gulp.task('prod', ['init.prod', 'html', 'vendor', 'js', 'css', 'test']);
gulp.task('clean', clean);


/*
  Sub tasks
*/
gulp.task('init.dev', function() {
    config.buildType = 'dev';
    config.cleanFlag = true;
});

gulp.task('init.prod', function() {
    config.buildType = 'prod';
    config.cleanFlag = true;
});

gulp.task('prebuild', function(cb) {
// `cleanFlag` prevents clean during watch
    if (config.cleanFlag) {
        config.cleanFlag = false;
        clean(cb);
    }
    else cb();
});

gulp.task('html', ['prebuild'], function() {
    return gulp.src('./src/*.html')
        .pipe(gulp.dest('./dist/'))
});

gulp.task('vendor', ['prebuild'], function() {
    return gulp.src([
            './src/js/vendor/**/*.js'
        ])
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest('./dist/js/'));
});

gulp.task('js', ['prebuild'], function() {
    let src = transpile('./src/js/main.js');

    if (config.buildType === 'prod') {
        return src.pipe(buffer()) // https://github.com/gulpjs/gulp/issues/369
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./dist/js/'));
    }
    else {
        return src.pipe(gulp.dest('./dist/js/'));
    }
});

gulp.task('css', ['prebuild'], function() {
    var src = gulp.src([
            './src/css/**/*.less'
        ])
        .pipe(plumber({
            errorHandler: errorHandler
        }))
        .pipe(less())
        .pipe(concat('main.css'));

        if (config.buildType === 'prod') {
            src.pipe(cleanCSS());
        }
        src.pipe(gulp.dest('./dist/css/'));

    return src;
});

gulp.task('test', ['prebuild'], function() {
    return transpile('./src/test/**/*.js')
        .pipe(gulp.dest('./dist/test/'));
});

gulp.task('watch', function() {
    gulp.watch('./src/*.html', ['html']);
    gulp.watch('./src/js/vendor/**/*.js', ['vendor']);
    gulp.watch([
            './src/js/main.js',
            './src/js/modules/**/*.js',
            './src/js/lib/**/*.js'
        ], ['js']);
    gulp.watch('./src/css/**/*.less', ['css']);
    gulp.watch('./src/test/**/*.js', ['test']);
});


/*
  Utils
*/
function errorHandler(err) {
    gutil.log(err.toString());
    gutil.log('\r\n' + err.codeFrame);
    gutil.beep();
    this.emit('end');
}

function transpile(files) {
    return gulp.src(files)
        .pipe(plumber({
            errorHandler: errorHandler
        }))
        // https://github.com/gulpjs/gulp/issues/369
        .pipe(tap(file => {
            file.contents = browserify(file.path, {debug: true})
                .transform('babelify', {
                    presets: ['es2015']
                })
                .bundle()
            }
        ));
}

function clean(cb) {
    del('./dist').then(paths => {
        paths.forEach(p => gutil.log(`Removed ${p}`));
        cb();
    });
}
