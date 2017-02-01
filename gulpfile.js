const gulp = require('gulp');
const sass = require('gulp-sass');
const bs = require('browser-sync').create();
const reload = bs.reload;

var src = {
	scss: 'app/scss/*.scss',
	css:  'app/css',
	html: 'app/*.html'
};

gulp.task('browsersync', ['sass'], function() {
	bs.init({
		server: "./app"
	});

	gulp.watch(src.scss, ['sass']);
	gulp.watch(src.html).on('change', reload);
});

gulp.task('sass', function() {
	return gulp.src(src.scss)
		.pipe(sass())
		.pipe(gulp.dest(src.css))
		.pipe(reload({stream: true}));
});

gulp.task('default', ['browsersync']);