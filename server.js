var express = require('express'),
    exphbs  = require('express3-handlebars');
   
var app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Static assets
app.use(express.static(__dirname + '/static'));

// Index
app.get('/', function (req, res) {
    res.render('index', {
    	title: "Connecting",
    	css: "index.css",
    	js: "index.js"
    });
});

// Now Playing
app.get('/now-playing', function (req, res) {
    res.render('now-playing', {
    	title: "Now Playing",
    	css: "now-playing.css",
    	js: "now-playing.js",
    	artist: "Chevelle",
    	album: "Wonder What's Next",
    	song: "The Red",
    	art: "http://christianmusic.com/chevelle/chevelle-3.jpg",
    	genre: "Hard Rock"
    });
});

app.listen(3000);