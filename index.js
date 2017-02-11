var http, director, bot, router, server, port;

http        = require('http');
director    = require('director');
bot         = require('./bot.js');
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

router = new director.http.Router({
  '/' : {
    post: bot.respond,
    get: ping
  }
});

var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  //start server after db init
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
});


function ping() {
  this.res.writeHead(200);
  this.res.end("Hey, I'm a bot written by Eric Ghildyal to get the weather for a specified city.");
}
