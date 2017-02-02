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
if you don't want DevTools 
```sh
git clone git@github.com:gharel/movio.git
cd movio
npm i
```
if you want DevTools (npm doesn't take sdk option in package.json)
```sh
git clone git@github.com:gharel/movio.git
cd movio
npm i nw@0.20.0-sdk
npm i
```
## Use
```sh
npm start
```

## Licence
MIT