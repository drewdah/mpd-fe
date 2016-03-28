var express = require('express'),
    exphbs  = require('express3-handlebars'),
	request = require("request"),
	url = require('url')

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
    	js: "now-playing.js"
    });
});

// Now Playing
app.get('/album-art', function (req, res) {

	var params = url.parse(req.url,true).query,
		albumUrl = "http://www.theaudiodb.com/api/v1/json/1/searchalbum.php?s=" + params.s + "&a=" + params.a;

	req.pipe(request(albumUrl)).pipe(res);
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

app.listen(server_port, server_ip_address);
