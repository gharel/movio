'use strict';

// TODO button to choose folder dynamically
// TODO Order name, year, rating
// TODO Filter by genre, actor, director
// TODO Details page for a movie
// TODO Launch with vlc or select in explorer

const folder = 'C:\\Users\\Guillaume\\Downloads\\PopcornTime';
//const folder = 'C:\\Users\\Guillaume\\Downloads\\Films';
const path = require('path');
const fs = require('fs');
const pug = require('pug');
const imdb = require('imdb-api');
const allocine = require('allocine-api');

let win = nw.Window.get();
let console = win.window.console;
let movies = [];
let count = 0;

function render(count, files) {
	if (count >= files.length) {
		pug.renderFile('movies.pug', {"movies": movies}, (err, res) => {
			win.window.document.getElementById("movio").innerHTML = res;
		});

		console.log(movies);
	}
}

fs.readdir(folder, (err, files) => {
	files.forEach((file) => {
		let movieName = path.parse(file).name;

		// see http://www.regexr.com to test this regex
		movieName = movieName.replace(/(\(|\.| )+(19|20)[0-9]{2}(\)|\.| ).*/g, ""); // delete everything after year
		movieName = movieName.replace(/\([^)]*\)|\[[^\]]*\]|1080p|x264|WEB-DL|BluRay|BrRip|720p/g, ""); // delete content between brackets, etc.
		movieName = movieName.replace(/\./g, " "); // replace dot per space
		movieName = movieName.replace(/ + /g, " "); // remove multiple space
		movieName = movieName.replace(/^ /g, ""); // remove first space

		imdb.get(movieName, (err, movie) => {
			count++;

			if (err) {
				allocine.api('search', {q: movieName, filter: 'movie'}, (err, res) => {
					let movieObj = {};
					movieObj.title = movieName;
					if (err) {
						console.log(err);
					} else if(res.feed.movie) {
						movieObj.title = res.feed.movie[0].title;
						movieObj.year = res.feed.movie[0].productionYear;
						movieObj.poster = res.feed.movie[0].poster.href;
						movieObj.rating = (parseFloat(res.feed.movie[0].statistics.userRating) * 2).toFixed(1);
					}
					movies.push(movieObj);

					render(count, files);
				});
			} else {
				movies.push(movie);
			}

			render(count, files);
		});
	});
});