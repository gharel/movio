'use strict';

const gulp = require('gulp');
const bs = require('browser-sync').create();
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const csscomb = require('gulp-csscomb');
const sourcemaps = require('gulp-sourcemaps');

const dir = {
	src: {
		scss: 'app/scss/**/*.scss',
		html: 'app/*.html',
		js: 'app/js/**/*.js',
		pug: 'app/views/**/*.pug'
	},
	dist: {
		scss: 'app/scss',
		css: 'app/css'
	}
};

gulp.task('csscomb', function () {
	return gulp.src(dir.src.scss)
		.pipe(csscomb())
		.pipe(gulp.dest(dir.dist.scss));
});

gulp.task('sass', function () {
	return gulp.src(dir.src.scss)
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(rename('style.min.css'))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(dir.dist.css))
		.pipe(bs.reload({stream: true}));
});

gulp.task('browsersync', ['sass'], function () {
	bs.init({
		server: "./app",
		open: false
	});

	gulp.watch(dir.src.scss, ['sass']);
	gulp.watch(dir.src.html).on('change', bs.reload);
	gulp.watch(dir.src.js).on('change', bs.reload);
	gulp.watch(dir.src.pug).on('change', bs.reload);
});

gulp.task('default', ['browsersync']);