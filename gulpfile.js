'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');

const dir = {
	src: {
		scss: 'app/scss/**/*.scss'
	},
	dist: {
		css: 'app/css'
	}
};

gulp.task('sass', function () {
	return gulp.src(dir.src.scss)
		.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(rename('style.min.css'))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(dir.dist.css));
});

gulp.task('sass:watch', function () {
	gulp.watch(dir.dist.scss, ['sass']);
});

gulp.task('default', ['sass']);