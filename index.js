'use strict';

// TODO button to choose folder dynamically
// TODO Order name, year, rating
// TODO Filter by genre, actor, director
// TODO Details page for a movie
// TODO Launch with vlc or select in explorer

const folder = 'C:\\Users\\Guillaume\\Downloads\\PopcornTime';
const path = require('path');
const fs = require('fs');
const pug = require('pug');
const imdb = require('imdb-api');

let win = nw.Window.get();
let console = win.window.console;
let movies = [];
let count = 0;

fs.readdir(folder, (err, files) => {
	files.forEach((file) => {
		let movie = path.parse(file).name;

		// see http://www.regexr.com to test this regex
		movie = movie.replace(/(\(|\.| )+(19|20)[0-9]{2}(\)|\.| ).*/g, ""); // delete everything after year
		movie = movie.replace(/\([^)]*\)|\[[^\]]*\]|1080p|x264|WEB-DL|BluRay|BrRip|720p/g, ""); // delete content between brackets, etc.
		movie = movie.replace(/\./g, " "); // replace dot per space
		movie = movie.replace(/ + /g, " "); // remove multiple space
		movie = movie.replace(/^ /g, ""); // remove first space

		imdb.get(movie).then((movie) => {
			count++;

			movies.push(movie);

			if (count >= files.length) {
				pug.renderFile('movies.pug', {"movies": movies}, (err, res) => {
					win.window.document.getElementById("movio").innerHTML = res;
				});

				//console.log(movies);
			}
		});
	});
});