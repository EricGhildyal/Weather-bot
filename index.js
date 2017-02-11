var http, director, bot, router, server, port;

http        = require('http');
director    = require('director');
bot         = require('./bot.js');

var mongoose = require('mongoose');
var mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI);
var db = mongoose.connection;
db.on('error', function(err){
  console.log("Connection to DB failed " + err);
});
db.on('open', function (){
  console.log("Db connected");
});

router = new director.http.Router({
  '/' : {
    post: bot.respond,
    get: ping
  }
});

server = http.createServer(function (req, res) {
  req.chunks = [];
  req.on('data', function (chunk) {
    req.chunks.push(chunk.toString());
  });

  router.dispatch(req, res, function(err) {
    res.writeHead(err.status, {"Content-Type": "text/plain"});
    res.end(err.message);
  });
});

port = Number(process.env.PORT || 5000);
server.listen(port);

mongoose.disconnect();

function ping() {
  this.res.writeHead(200);
  this.res.end("Hey, I'm a bot written by Eric Ghildyal to get the weather for a specified city.");
}
