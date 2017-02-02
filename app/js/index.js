(function () {
	'use strict';

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
	// store movie path, filename, title and year (if found)
	let moviesfiles = [];

	// store connection and db with indexedDB
	let connection, db;
	let options = {
		api: "imdb",
		folder: null,
		orderby: "title",
		order: "asc",
		fallback: true,
		extensions: [".avi", ".mkv", ".mp4"],
		env: "dev"
	};
	// store that we find options in localStorage
	let localstorage = false;
	// store if window is maximize or not
	let maximize = false;
	win.unmaximize();

	if (options.env === "dev") {
		// in developement we show dev tools
		win.showDevTools();
		win.focus();
	}


	// initialize application
	function init() {
		if (options.env !== "dev") {
			// in production, we can remove console.log with options.log set to false
			console.log = function () {
			};
		}

		window.onload = function () {
			getConfig();
			createDb(() => {
				setTimeout(() => {
					renderLayout();
					getDefaultFolder();
					getAllMoviesFiles(options.folder);
				}, 5000);
			});
		};
	}

	// create indexedDB to store movie from API and avoid call each time the API
	function createDb(callback) {
		connection = indexedDB.open("movio", 1);

		connection.onupgradeneeded = (e) => {
			let thisDB = e.target.result;
			if (!thisDB.objectStoreNames.contains("movie")) {
				thisDB.createObjectStore("movie");
			}
		};

		connection.onsuccess = (e) => {
			db = e.target.result;
			callback(null, "");
		};
	}

	// insert movie infos from API to indexedDB
	function addMovieInfosToDB(movieapi, moviepath) {
		getMovieInfosFromDB(moviepath, (err, res) => {
			let data;
			if (err) {
				data = movieapi;
			} else {
				// concatenate previous infos get from indexedDB with new from API
				data = Object.assign(res, movieapi);
			}
			db.transaction(["movie"], "readwrite").objectStore("movie").put(data, moviepath);
		});
	}

	// get movie infos from indexedDB
	function getMovieInfosFromDB(moviepath, callback) {
		let request = db.transaction(["movie"], "readonly").objectStore("movie").get(moviepath);

		request.onsuccess = (e) => {
			if (request.result) {
				callback(null, request.result);
			} else {
				callback("movie not found");
			}
		};
	}

	// get options form localStorage
	function getConfig() {
		localstorage = false;
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
				localstorage = true;
			}
		}
	}

	// set options of application to localStorage to find them on later use (don't set them if they exists)
	function setConfig() {
		if (!localstorage) {
			for (let i in options) {
				if (options.hasOwnProperty(i)) {
					localStorage.setItem(i, options[i]);
				}
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
		pug.renderFile('app/views/layout.pug', {}, (err, res) => {
			let elapiimdb, elapiallocine, elsorttitle, elsortyear, elsortrating, elsortasc, elsortdesc;
			setConfig();

			document.querySelector(".js-page").innerHTML = res;
			document.querySelector('.js-path').innerHTML = options.folder;

			elapiimdb = document.querySelector('.js-api-imdb');
			elapiallocine = document.querySelector('.js-api-allocine');
			elsorttitle = document.querySelector('.js-sort-title');
			elsortyear = document.querySelector('.js-sort-year');
			elsortrating = document.querySelector('.js-sort-rating');
			elsortasc = document.querySelector('.js-sort-asc');
			elsortdesc = document.querySelector('.js-sort-desc');

			document.querySelector('.js-minimize').addEventListener('click', () => {
				win.minimize();
			});

			document.querySelector('.js-maximize').addEventListener('click', () => {
				if (maximize) {
					win.unmaximize();
				} else {
					win.maximize();
				}
				maximize = !maximize;
			});

			document.querySelector('.js-close').addEventListener('click', () => {
				win.close(true); //true to force close
			});

			document.querySelector('.js-open').addEventListener('click', () => {
				// trigger click on input file directory
				document.querySelector('.js-folder').click();
			});

			document.querySelector('.js-folder').addEventListener('change', (event) => {
				openNewFolder(event);
			});

			document.querySelector('.js-sort').addEventListener('click', function () {
				this.parentNode.classList.toggle('active');
				if (options.order === 'asc') {
					elsortasc.classList.add('active');
				} else {
					elsortdesc.classList.add('active');
				}
				if (options.orderby === 'title') {
					elsorttitle.classList.add('active');
				} else if(options.orderby === 'year') {
					elsortyear.classList.add('active');
				} else {
					elsortrating.classList.add('active');
				}
			});
			elsortasc.addEventListener('click', function () {
				this.classList.add('active');
				elsortdesc.classList.remove('active');
				sortMovies(null, 'asc');
			});
			elsortdesc.addEventListener('click', function () {
				this.classList.add('active');
				elsortasc.classList.remove('active');
				sortMovies(null, 'desc');
			});
			elsorttitle.addEventListener('click', function () {
				this.classList.add('active');
				elsortyear.classList.remove('active');
				elsortrating.classList.remove('active');
				sortMovies('title', null);
			});
			elsortyear.addEventListener('click', function () {
				this.classList.add('active');
				elsorttitle.classList.remove('active');
				elsortrating.classList.remove('active');
				sortMovies('year', null);
			});
			elsortrating.addEventListener('click', function () {
				this.classList.add('active');
				elsortyear.classList.remove('active');
				elsorttitle.classList.remove('active');
				sortMovies('rating', null);
			});

			document.querySelector('.js-filter').addEventListener('click', function () {
				this.parentNode.classList.toggle('active');
			});

			document.querySelector('.js-api').addEventListener('click', function () {
				this.parentNode.classList.toggle('active');
				if (options.api === 'imdb') {
					elapiimdb.classList.add('active');
				} else {
					elapiallocine.classList.add('active');
				}
			});
			elapiimdb.addEventListener('click', function () {
				this.classList.add('active');
				elapiallocine.classList.remove('active');
				changeApi('imdb');
			});
			elapiallocine.addEventListener('click', function () {
				this.classList.add('active');
				elapiimdb.classList.remove('active')
				changeApi('allocine');
			});
		});
	}

	// generate HTML of movies and listen click on movie
	function renderMovie() {
		let el;
		sortArray(moviesinfos, options.order);

		pug.renderFile('app/views/movies.pug', {"movies": moviesinfos}, (err, res) => {
			document.querySelector(".js-movies").innerHTML = res;

			el = document.querySelectorAll('.movie__content');
			el.forEach((element) => {
				element.addEventListener('click', (event) => {
					console.log(event.target);
				});
			});
		});
	}

	// open new folder with a system modal thanks to input file directory
	function openNewFolder(event) {
		if (event.target.value && event.target.value !== "" && options.folder !== event.target.value) {
			options.folder = event.target.value;
			localStorage.setItem("folder", options.folder);

			document.querySelector('.js-path').innerHTML = options.folder;

			getAllMoviesFiles(options.folder);

		}
	}

	// change order and orderby options and render movies after that
	function sortMovies(orderby, order) {
		if (orderby){
			options.orderby = orderby;
		}
		if(order) {
			options.order = order;
		}

		localStorage.setItem("orderby", options.orderby);
		localStorage.setItem("order", options.order);

		renderMovie();
	}

	// change API used to retrieve movie's data
	function changeApi(api) {
		options.api = api;

		localStorage.setItem("api", options.api);

		getAllMoviesInfos();
	}

	// define default folder with downloads directory for windows or home directory for others
	function getDefaultFolder() {
		if (!localstorage) {
			let folder = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
			if (process.platform === 'win32') {
				folder += '\\Downloads';
			}
			options.folder = folder;
			localStorage.setItem('folder', options.folder);

			document.querySelector('.js-path').innerHTML = options.folder;
		}
	}

	// retrieve moviepath by title from moviefiles array
	function getMoviePathByTitle(title, callback) {
		moviesfiles.forEach((element) => {
			if (element.title === title) {
				callback(null, element.path);
			}
		});
		callback("path not found");
	}

	// get movies path into an array
	function getAllMoviesFiles(folder) {
		moviesfiles = [];

		if (!folder || folder === "") {
			getDefaultFolder();
		}
		readFolder(folder, (err, res) => {
			filterMoviesFiles(res, (err, res) => {
				res.forEach((element, index, array) => {
					let year, title;
					let filename = path.parse(element).name;

					// see http://www.regexr.com to test regex
					year = filename.match(/(19|20)[0-9]{2}/gi);
					if (year) {
						year = year[0];
					} else {
						year = null;
					}
					title = filename.replace(/[\(|\.| ]*([19|20][0-9]{2}|dvdrip|french|1080p|x264|web-dl|bluray|brrip|720p)[\)|\.| ]*.*/gi, ""); // remove everything after year or specific words
					title = title.replace(/\./gi, " "); // replace dot per space
					title = title.replace(/ + /gi, " "); // remove multiple space
					title = title.replace(/^ /gi, ""); // remove first space
					title = title.replace(/ $/gi, ""); // remove last space

					array[index] = {
						path: element,
						filename: filename,
						title: title,
						year: year
					};
				});
				moviesfiles = res;
				console.log(moviesfiles);
				getAllMoviesInfos();
			});
		});
	}

	// get all movies infos form movies path array
	function getAllMoviesInfos() {
		let pending;
		let movieapi = {};
		moviesinfos = [];
		pending = moviesfiles.length;
		moviesfiles.forEach((element) => {
			getMovieInfosFromDB(element.path, (err, res) => {
				if (err) {
					getMovieInfos(element.title, element.year, (err, res) => {
						pending--;
						moviesinfos.push(res);
						if (!pending) {
							renderMovie();
						}
					});
				} else {
					// if we find IMDB infos in indexedDB and API used is IMDB
					if (res.imdb && options.api === "imdb") {
						pending--;
						movieapi.imdb = res.imdb[0];
						moviesinfos.push(movieapi.imdb);
						if (!pending) {
							renderMovie();
						}
						// if we find Allocine infos and fallback from IMDB is on
					} else if (res.allocine && options.fallback) {
						pending--;
						movieapi.allocine = convertMovieInfosFromAllocine(element.title, element.year, res.allocine);
						moviesinfos.push(movieapi.allocine);
						if (!pending) {
							renderMovie();
						}
					} else {
						getMovieInfos(element.title, element.year, (err, res) => {
							pending--;
							moviesinfos.push(res);
							if (!pending) {
								renderMovie();
							}
						});
					}
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
	function getMovieInfos(title, year, callback) {
		if (options.api === "imdb") {
			getMovieInfosFromImdb(title, year, callback);
		} else {
			getMovieInfosFromAllocine(title, year, callback);
		}
	}

	// get infos for a movie with IMDB API
	function getMovieInfosFromImdb(title, year, callback) {
		let result = {};
		let moviepath;
		imdb.get(title, (err, res) => {
			console.log('IMDB API call', err, res);
			if (err) {
				if (options.fallback) {
					getMovieInfosFromAllocine(title, year, callback);
				} else {
					result.title = title;
					return callback(err, result);
				}
			} else {
				getMoviePathByTitle(title, (err, moviepath) => {
					if (!err) {
						addMovieInfosToDB({imdb: [res]}, moviepath);
					}
				});
				return callback(null, res);
			}
		});
	}

	// get infos for a movie with Allocine API
	function getMovieInfosFromAllocine(title, year, callback) {
		let result = {};
		allocine.api('search', {q: title, filter: 'movie', count: 5}, (err, res) => {
			console.log('Allocine API call', err, res);
			if (res.feed.movie) {
				result = convertMovieInfosFromAllocine(title, year, res.feed.movie);
				getMoviePathByTitle(title, (err, moviepath) => {
					if (!err) {
						addMovieInfosToDB({allocine: res.feed.movie}, moviepath);
					}
				});
				return callback(null, result);
			}
			result.title = title;
			return callback(err, result);
		});
	}

	// reformat data from allocine to get right movie infos and look like IMDB data
	function convertMovieInfosFromAllocine(title, year, movieArray) {
		let result = {title: title};

		for (let i = 0; i < movieArray.length; i++) {
			// if just one movie in result
			// or if year doesn't present in filename on hard drive
			// or year form data is same than year form filename
			// and original title from data is same than title from filename
			// or title from data exist and is same than title form filename
			if (movieArray.length == 1 || !year || (
					parseInt(movieArray[i].productionYear, 10) === parseInt(year, 10) && (
						movieArray[i].originalTitle.toLowerCase() === title.toLowerCase() || (
							movieArray[i].title && movieArray[i].title.toLowerCase() === title.toLowerCase()
						)
					)
				)
			) {
				// Allocine's API have original title and title (often translation in french)
				result.title = movieArray[i].title ? movieArray[i].title : movieArray[i].originalTitle;
				result.year = movieArray[i].productionYear;
				result.poster = movieArray[i].poster ? movieArray[i].poster.href : "";
				// convert rating from Allocine to look like rating IMDB
				result.rating = movieArray[i].statistics ? (parseFloat(movieArray[i].statistics.userRating) * 2).toFixed(1) : "N/A";
				return result;
			}
		}
		return result;
	}

	init();
})();