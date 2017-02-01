(function () {
	'use strict';

	// TODO IndexedDB to store movie
	// TODO SASS
	// TODO BrowserSync
	// TODO Details page for a movie
	// TODO Filter by genre, rating, year, actor, director
	// TODO Launch movie with vlc or open explorer and select it

	const path = require('path');
	const fs = require('fs');
	const gui = require('nw.gui');
	const pug = require('pug');
	const imdb = require('imdb-api');
	const allocine = require('allocine-api');
	const win = gui.Window.get();
	const console = win.window.console;

	// store movie infos from API
	let moviesinfos = [];
	// store movie path
	let moviesfiles = [];
	let options = {
		api: "imdb",
		folder: null,
		orderby: "title",
		order: "asc",
		fallback: true,
		extensions: [".avi", ".mkv", ".mp4"],
		log: true
	};
	// store if application is occupy
	let working = false;

	// initialize application
	function init() {
		if (!options.log) {
			// in production, we can remove console.log with options.log set to false
			console.log = function () {
			};
		}

		window.onload = function () {
			getConfig();
			renderLayout();

			getDefaultFolder();
			getAllMoviesFiles(options.folder);
		};
	}

	// get options form localStorage
	function getConfig() {
		for (let i in localStorage) {
			if (localStorage.hasOwnProperty(i)) {
				options[i] = localStorage.getItem(i);

				// convert options from localstorage to retrieve their real type and avoid error when used options
				if (options[i] === "true") {
					options[i] = true;
				} else if (options[i] === "false") {
					options[i] = false;
				}
				// convert extensions from string to array
				if (i === "extensions") {
					options[i] = options[i].split(",");
				}
			}
		}
	}

	// set options of application to localStorage to find them on later use
	function setConfig() {
		for (let i in options) {
			if (options.hasOwnProperty(i)) {
				localStorage.setItem(i, options[i]);
			}
		}
	}

	// use in sortArray to compare infos to ordering them
	function compare(a, b) {
		if (a[options.orderby] < b[options.orderby]) {
			return -1;
		}
		return 1;
	}

	// use in renderMovie to order movie
	function sortArray(array, order) {
		let tmp = array.sort(compare);
		if (order === "desc") {
			tmp = array.reverse();
		}
		return tmp;
	}

	// generate HTML layout of application and add listener for menu item
	function renderLayout() {
		pug.renderFile('layout.pug', {}, (err, res) => {
			setConfig();

			document.getElementById("movio").innerHTML = res;

			document.querySelector('.js-open').addEventListener('click', () => {
				openNewFolder();
			});

			document.querySelector('.js-sort').addEventListener('click', () => {
				sortMovies();
			});

			document.querySelector('.js-api').addEventListener('click', () => {
				changeApi();
			});
		});
	}

	// generate HTML of movies and listen click on movie
	function renderMovie() {
		let el;
		sortArray(moviesinfos, options.order);

		pug.renderFile('movies.pug', {"movies": moviesinfos}, (err, res) => {
			working = false;
			document.getElementById("js-main").innerHTML = res;

			el = document.querySelectorAll('.movie__content');
			el.forEach((element) => {
				element.addEventListener('click', (event) => {
					console.log(event.target);
				});
			});
		});
	}

	// open new folder with a system modal thanks to input file
	function openNewFolder() {
		let input = document.querySelector('.field-folder');
		if (!working) {
			working = true;
			input.addEventListener('change', (event) => {
				options.folder = event.target.value;
				localStorage.setItem("folder", options.folder);

				getAllMoviesFiles(options.folder);
			});
			input.click();
		}
	}

	// change order and orderby options and render movies after that
	function sortMovies() {
		if (options.orderby === "title" && options.order === "desc") {
			options.orderby = "year";
		} else if (options.orderby === "year" && options.order === "desc") {
			options.orderby = "rating";
		} else if (options.orderby === "rating" && options.order === "desc") {
			options.orderby = "title"
		}

		if (options.order === "asc") {
			options.order = "desc";
		} else {
			options.order = "asc";
		}

		localStorage.setItem("orderby", options.orderby);
		localStorage.setItem("order", options.order);

		renderMovie();
	}

	// change API used to retrieve movie's data
	function changeApi() {
		if (options.api === "imdb") {
			options.api = "allocine";
		} else {
			options.api = "imdb";
		}

		localStorage.setItem("api", options.api);

		getAllMoviesInfos();
	}

	// define default folder with downloads directory for windows or home directory for others
	function getDefaultFolder() {
		let folder = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
		if (process.platform === 'win32') {
			folder += '\\Downloads';
		}
		options.folder = folder;
		localStorage.setItem('folder', options.folder);
	}

	// get movies path into an array
	function getAllMoviesFiles(folder) {
		moviesfiles = [];

		readFolder(folder, (err, res) => {
			filterMoviesFiles(res, (err, res) => {
				moviesfiles = res;
				getAllMoviesInfos();
			});
		});
	}

	// get all movies infos form movies path array
	function getAllMoviesInfos() {
		let pending;
		moviesinfos = [];
		pending = moviesfiles.length;
		moviesfiles.forEach((element) => {
			getMovieInfos(element, (err, res) => {
				pending--;
				moviesinfos.push(res);
				if (!pending) {
					renderMovie();
				}
			});
		});
	}

	// read folder recursively to get files in directory and sub directory
	function readFolder(folder, callback) {
		let results = [];
		fs.readdir(folder, (err, files) => {
			let pending;
			if (err) {
				return callback(err);
			}
			pending = files.length;
			if (!pending) {
				return callback(null, results);
			}
			files.forEach((file) => {
				file = path.resolve(folder, file);
				fs.stat(file, (err, stat) => {
					if (stat && stat.isDirectory()) {
						readFolder(file, (err, res) => {
							pending--;
							results = results.concat(res);
							if (!pending) {
								callback(null, results);
							}
						});
					} else {
						results.push(file);
						pending--;
						if (!pending) {
							callback(null, results);
						}
					}
				});
			});
		});
	}

	// keep in array only movies thanks to extensions
	function filterMoviesFiles(array, callback) {
		array = array.filter((element) => {
			let flag = false;
			options.extensions.forEach((extension) => {
				// compare extensions from file to extensions allowed
				if (path.extname(element) === extension) {
					flag = true;
				}
			});
			if (flag) {
				return element;
			}
		});
		return callback(null, array);
	}

	// get infos for a movie with API
	function getMovieInfos(filepath, callback) {
		let result = {title: path.parse(filepath).name};

		// see http://www.regexr.com to test regex
		result.year = result.title.match(/(19|20)[0-9]{2}/gi);
		if (result.year) {
			result.year = result.year[0];
		}
		result.title = result.title.replace(/[\(|\.| ]*([19|20][0-9]{2}|dvdrip|french|1080p|x264|web-dl|bluray|brrip|720p)[\)|\.| ]*.*/gi, ""); // remove everything after year or specific words
		result.title = result.title.replace(/\./gi, " "); // replace dot per space
		result.title = result.title.replace(/ + /gi, " "); // remove multiple space
		result.title = result.title.replace(/^ /gi, ""); // remove first space
		result.title = result.title.replace(/ $/gi, ""); // remove last space

		if (options.api === "imdb") {
			getMovieInfosFromImdb(result.title, result.year, callback);
		} else {
			getMovieInfosFromAllocine(result.title, result.year, callback);
		}
	}

	// get infos for a movie with IMDB API
	function getMovieInfosFromImdb(title, year, callback) {
		let result = {};
		imdb.get(title, (err, res) => {
			if (err) {
				if (options.fallback) {
					getMovieInfosFromAllocine(title, year, callback);
				} else {
					result.title = title;
					return callback(err, result);
				}
			} else {
				return callback(null, res);
			}
		});
	}

	// get infos for a movie with Allocine API
	function getMovieInfosFromAllocine(title, year, callback) {
		let result = {};
		allocine.api('search', {q: title, filter: 'movie', count: 5}, (err, res) => {
			if (res.feed.movie) {
				result = convertMovieInfosFromAllocine(title, year, res);
				return callback(null, result);
			}
			result.title = title;
			return callback(err, result);
		});
	}

	// reformat data from allocine to get right movie infos and look like IMDB data
	function convertMovieInfosFromAllocine(title, year, res) {
		let movie = res.feed.movie;
		let result = {title: title};

		for (let i = 0; i < movie.length; i++) {
			// if just one movie in result
			// or if year doesn't present in filename on hard drive
			// or year form data is same than year form filename
			// and original title from data is same than title from filename
			// or title from data exist and is same than title form filename
			if (movie.length == 1 || !year || (
					parseInt(movie[i].productionYear, 10) === parseInt(year, 10) && (
						movie[i].originalTitle.toLowerCase() === title.toLowerCase() || (
							movie[i].title && movie[i].title.toLowerCase() === title.toLowerCase()
						)
					)
				)
			) {
				// Allocine's API have original title and title (often translation in french)
				result.title = movie[i].title ? movie[i].title : movie[i].originalTitle;
				result.year = movie[i].productionYear;
				result.poster = movie[i].poster ? movie[i].poster.href : "";
				// convert rating from Allocine to look like rating IMDB
				result.rating = movie[i].statistics ? (parseFloat(movie[i].statistics.userRating) * 2).toFixed(1) : "N/A";
				return result;
			}
		}
		return result;
	}

	init();
})();