'use strict';

// TODO IndexedDB to store movie
// TODO Comments
// TODO SASS
// TODO BrowserSync
// TODO Details page for a movie
// TODO Filter by genre, actor, director
// TODO Launch with vlc or select in explorer

const path = require('path');
const fs = require('fs');
const gui = require('nw.gui');
const pug = require('pug');
const imdb = require('imdb-api');
const allocine = require('allocine-api');

let win = gui.Window.get();
let console = win.window.console;
let movies = [];
let moviespath = [];
let apiused = "imdb"; // imdb or allocine
let sortasc = true;
let fallbackapi = true;
let defaultindex = 0;
let flag = false;
let sortused = "title"; // title, year or rating
let folder;
let folderpath;

function getUserHome() {
	let folder = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
	if (process.platform === 'win32') {
		folder += '\\Downloads';
	}
	return folder;
}

function compare(a, b) {
	if (a[sortused] < b[sortused]) {
		return -1;
	} else {
		return 1;
	}
}

function sort(array, asc) {
	let temp = array.sort(compare);
	if (!asc) {
		temp = array.reverse();
	}
	return temp;
}

function renderLayout() {
	pug.renderFile('layout.pug', {}, (err, res) => {
		document.getElementById("movio").innerHTML = res;

		localStorage.setItem("currentfolder", folder);
		document.querySelector('.js-open').addEventListener('click', (event) => {
			openFolderModal();
		});

		localStorage.setItem("sortby", sortused);
		localStorage.setItem("asc", sortasc);
		document.querySelector('.js-sort').addEventListener('click', (event) => {
			if (sortused === "title" && !sortasc) {
				sortused = "year";
			} else if (sortused === "year" && !sortasc) {
				sortused = "rating";
			} else if (sortused === "rating" && !sortasc) {
				sortused = "title"
			}

			sortasc = !sortasc;
			localStorage.setItem("sortby", sortused);
			localStorage.setItem("asc", sortasc);

			renderMovie();
		});

		localStorage.setItem("currentapi", apiused);
		localStorage.setItem("apifallback", fallbackapi);
		document.querySelector('.js-api').addEventListener('click', (event) => {
			let pending;

			if (apiused === "imdb") {
				apiused = "allocine";
			} else {
				apiused = "imdb";
			}

			localStorage.setItem("currentapi", apiused);
			movies = [];

			pending = moviespath.length;
			moviespath.forEach((element) => {
				getMovie(element, (err, res) => {
					pending--;
					movies.push(res);
					if (!pending) {
						renderMovie();
					}
				});
			});
		});
	});
}

function openFolderModal() {
	let inputFolder = document.querySelector('.field-folder');
	inputFolder.addEventListener('change', (event) => {
		if (!flag) {
			flag = true;
			folderpath = event.target.value;
			localStorage.setItem("currentfolder", folderpath);
			readdirectory(folderpath);
		}
	});
	inputFolder.click();
}

function renderMovie() {
	let el;
	sort(movies, sortasc);

	console.log(movies);

	pug.renderFile('movies.pug', {"movies": movies}, (err, res) => {
		document.getElementById("js-main").innerHTML = res;

		el = document.querySelectorAll('.movie__content');
		el.forEach((element) => {
			element.addEventListener('click', (event) => {
				console.log(event.target);
			});
		});
	});
}

function filtermovies(array, callback) {
	array = array.filter((element) => {
		if (path.extname(element) === ".avi" || path.extname(element) === ".mkv" || path.extname(element) === ".mp4") {
			return element;
		}
	});
	return callback(null, array);
}

function readfolder(folder, callback) {
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
					readfolder(file, (err, res) => {
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

function getMovie(filepath, callback) {
	let result = {};
	result.title = path.parse(filepath).name;

	// see http://www.regexr.com to test this regex
	result.year = result.title.match(/(19|20)[0-9]{2}/gi);
	if (result.year) {
		result.year = result.year[0];
	}
	result.title = result.title.replace(/[\(|\.| ]*([19|20][0-9]{2}|dvdrip|french|1080p|x264|web-dl|bluray|brrip|720p)[\)|\.| ]*.*/gi, ""); // delete everything after year
	result.title = result.title.replace(/\./gi, " "); // replace dot per space
	result.title = result.title.replace(/ + /gi, " "); // remove multiple space
	result.title = result.title.replace(/^ /gi, ""); // remove first space
	result.title = result.title.replace(/ $/gi, ""); // remove last space

	if (apiused === "imdb") {
		getMovieImdb(result.title, result.year, callback);
	} else {
		getMovieAllocine(result.title, result.year, callback);
	}
}

function getMovieImdb(title, year, callback) {
	let result = {};
	imdb.get(title, (err, res) => {
		if (err) {
			if (fallbackapi) {
				getMovieAllocine(title, year, callback);
			} else {
				result.title = title;
				return callback(err, result);
			}
		} else {
			return callback(null, res);
		}
	});
}

function getMovieAllocine(title, year, callback) {
	let result = {};
	allocine.api('search', {q: title, filter: 'movie', count: 5}, (err, res) => {
		if (res.feed.movie) {
			result = changeMovieInfos(title, year, res);
			return callback(null, result);
		}
		result.title = title;
		return callback(err, result);
	});
}

function createMovieAllocine(title, res, i) {
	let result = {};
	result.title = title;

	result.title = res.feed.movie[i].title ? res.feed.movie[i].title : res.feed.movie[i].originalTitle;
	result.year = res.feed.movie[i].productionYear;
	result.poster = res.feed.movie[i].poster ? res.feed.movie[i].poster.href : "";
	result.rating = res.feed.movie[i].statistics ? (parseFloat(res.feed.movie[i].statistics.userRating) * 2).toFixed(1) : "N/A";

	return result;
}

function changeMovieInfos(title, year, res) {
	let result = {};
	result.title = title;

	if (res.feed.movie.length > 1) {
		for (let i = 0; i < res.feed.movie.length; i++) {
			if (
				parseInt(res.feed.movie[i].productionYear, 10) === parseInt(year, 10) &&
				(
					res.feed.movie[i].originalTitle.toLowerCase() === title.toLowerCase() ||
					(
						res.feed.movie[i].title &&
						res.feed.movie[i].title.toLowerCase() === title.toLowerCase()
					)
				) ||
				!year &&
				(
					res.feed.movie[i].originalTitle.toLowerCase() === title.toLowerCase() ||
					(
						res.feed.movie[i].title &&
						res.feed.movie[i].title.toLowerCase() === title.toLowerCase()
					)
				)
			) {
				result = createMovieAllocine(title, res, i);
				return result;
			}
		}
	} else {
		if (res.feed.movie[defaultindex]) {
			result = createMovieAllocine(title, res, defaultindex);
		}
	}
	return result;
}

function readdirectory(folder) {
	movies = [];
	moviespath = [];

	readfolder(folder, (err, res) => {
		flag = false;
		filtermovies(res, (err, res) => {
			let pending;
			moviespath = res;
			pending = moviespath.length;
			moviespath.forEach((element) => {
				getMovie(element, (err, res) => {
					pending--;
					movies.push(res);
					if (!pending) {
						renderMovie();
					}
				});
			});
		});
	});
}

function getPreviousConfig() {
	fallbackapi = localStorage.getItem('apifallback');
	sortasc = localStorage.getItem('asc');
	apiused = localStorage.getItem('currentapi');
	folder = localStorage.getItem('currentfolder');
	sortused = localStorage.getItem('sortby');
}

window.onload = function () {
	folder = getUserHome();

	getPreviousConfig();

	renderLayout();

	readdirectory(folder);
};