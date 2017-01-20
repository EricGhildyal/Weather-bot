var HTTPS = require('https');

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/weather .*/g;

  if(request.text && botRegex.test(request.text)) {
    var city = request.text.replace(/\/weather/g, ' ');
    this.res.writeHead(200);
    postMessage(city);
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function postMessage(city) {
  var botResponse, options, body, botReq;

  botResponse = getWeather(city);
  console.log("Resp = " + botResponse);

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(body));
}

function getWeather(city){
  console.log(city);
  city = city.replace(/^ */g, "");
  console.log(city);
  if(city == "help"){
    return "Default city is Pittsburgh, use /weather [city] for other cities \n More features to come!";
  }else{
    return "I didn't understand that :(";
  }
}


exports.respond = respond;
