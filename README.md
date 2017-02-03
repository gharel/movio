# Movio

**:warning: Work in progress :warning:**

Desktop application to help you on local movie's choice

## Tasks list

- [x] Use indexedDB to store movie data from API
- [x] Use SASS
- [x] Use BrowserSync to live reload
- [x] Remove system's titlebar
- [x] Review UI on menu, filter and order
- [x] Include in app Normalize (broken if offline)
- [x] Refactor SCSS to use BEMIT (ITCSS)
- [ ] Refactor code of renderLayout (addEventListener)
- [ ] Debug gulpfile to use CSSComb correctly
- [ ] During Splash screen read folder and load movie's infos and display them after loading
- [ ] Create Details page for a movie
- [ ] Filter movies by genre, rating, year, actor, director
- [ ] Include in app Google Fonts et Font Awesome (broken if offline)
- [ ] Launch movie with vlc or open explorer and select it
- [ ] Internationalization
- [ ] Create About page
- [ ] Change Context menu

## Technologies - languages

- HTML
- CSS
- SASS
- BEM
- ITCSS
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

You need Ruby and SASS install on your machine  
Ruby *(already install on MacOS)*: https://www.ruby-lang.org/fr/documentation/installation  
SASS: http://sass-lang.com/install  

to run gulp (launch browser-sync and watch SASS file)
```sh
npm start
```
and then in other terminal window to run NW.js
```sh
npm run movio
```
if you want to clean your SASS file
```sh
npm start csscomb
```

## Licence

MIT