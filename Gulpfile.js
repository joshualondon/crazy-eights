var gulp = require("gulp"),
    browserSync = require("browser-sync").create(),
	reload = browserSync.reload,
    sass = require("gulp-sass"),
    sourcemaps = require('gulp-sourcemaps'),
    postcss = require('gulp-postcss'),
	cssnano = require('gulp-cssnano'),
	rename = require('gulp-rename'),
    autoprefixer = require('autoprefixer'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	concat = require('gulp-concat'),
	del = require('del'),
	notify = require('gulp-notify'),
	ghPages = require('gulp-gh-pages')
	inlinesource = require('gulp-inline-source');


// build, prefix and reload css
gulp.task('css', function() {
	return gulp.src(['src/assets/scss/timer.scss'])
	.pipe(sass().on('error', sass.logError))
	.pipe(postcss([
		autoprefixer({
			browsers: ['last 5 versions', 'iOS 8']
		})
	]))
	.pipe(gulp.dest('dist/assets/css'))
	.pipe(rename({ suffix: '.min' }))
	.pipe(cssnano())
	.pipe(gulp.dest('dist/assets/css'))
	.pipe(browserSync.stream())
	.pipe(notify({ message: '✓ CSS complete' }));
});


// inline the first responders css
gulp.task('inlinecss', function() {
	return gulp.src('./src/index.html')
	.pipe(inlinesource())
	.pipe(gulp.dest('./dist'))
});



// JS
gulp.task('js', function() {
	return gulp.src('src/assets/js/!(facebook.js)*.js')
	//.pipe(jshint('.jshintrc'))
	//.pipe(jshint.reporter('default'))
	.pipe(concat('timer.js'))
	.pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
	.pipe(gulp.dest('dist/assets/js'))
    .pipe(notify({ message: '✓ JS complete' }));
});



// copy
gulp.task('copy', function() {
	return gulp.src(['src/index.html', 'CNAME'])
	.pipe(gulp.dest('dist/'))
	.pipe(notify({ message: '✓ Copy complete' }));
});


// Watch
gulp.task('watch', function() {

	// scss
	gulp.watch('src/assets/scss/**/*.scss', ['css']);

	// JS
	gulp.watch('src/assets/js/*.js', ['js']);

	// html
	gulp.watch('src/*.html', ['copy', 'inlinecss']);

});



// Clean the dist
gulp.task('clean', function() {
	return del(['dist/assets', 'dist/*.html'])
});



gulp.task('serve', function() {
	browserSync.init({
		startPath: '',
		server: {
			baseDir: 'dist',
			index: 'index.html',
			// routes: {
			// 	'/src' : '/dist'
			// }
		}
	});

	gulp.watch(['src/*.html', 'src/assets/js/*.js', 'src/assets/scss/critical-css.scss']).on('change', reload);
});


gulp.task('default', ['clean'], function() {
	gulp.start('css', 'js', 'copy', 'watch', 'serve');
});


// ------
// Gulp deploy to gh-pages
// ------


gulp.task('deploy', function() {
	return gulp.src('./dist/**/*')
	.pipe(ghPages());
});
