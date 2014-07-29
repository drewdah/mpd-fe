var http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');
var mopidy = require('mopidy');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(index);
}).listen(9615);

var mpd = new mopidy({
   webSocketUrl: "ws://localhost:6680/mopidy/ws/"
});

mpd.on(console.log.bind(console));
