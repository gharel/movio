# Movio
**:warning: Work in progress :warning:**

Desktop application to help you on local movie's choice

## Tasks list
- [x] Use indexedDB to store movie data from API
- [ ] Use SASS
- [ ] Use BrowserSync to live reload
- [ ] Create Details page for a movie
- [ ] Filter movies by genre, rating, year, actor, director
- [ ] Launch movie with vlc or open explorer and select it
- [ ] Review UI on menu, filter and order
- [ ] Remove system's titlebar
- [ ] Internationalization
- [ ] Create About page
- [ ] Change Context menu

## Technologies - languages
- HTML
- CSS
- SASS
- JavaScript
- PUG (Jade)
- node.js
- nw.js (Node Webkit)

## API used
node-imdb-api: https://github.com/worr/node-imdb-api  
node-allocine-api: https://github.com/leeroybrun/node-allocine-api

## Install
Not tested yet (maybe you have to use `npm i -g nw` and/or `npm i -g browser-sync`)
```sh
git clone git@github.com:gharel/movio.git
cd movio
npm i
```

## Use
```sh
npm start
```

## Licence
MIT