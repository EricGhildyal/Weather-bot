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
  var cityList = JSON.parse("city-list.json");
  console.log(cityList[1]);
  city = city.replace(/^ */g, ""); //remove weird whitespace being added
  console.log(city);
  if(city == "help"){ //first thing to check
    return "Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come!";
  }

  var cityCode = -1;
  for(var i = 0; i < cityList.length(); i++){ //loop trough json file checking for a city name match
    if(city == cityList[i].name.toLowerCase()){
      cityCode = cityList[i]._id;
      break;
    }
  }

  if(cityCode != -1){ //make sure city code was set
    return "city code = " + cityCode;
  }else{
    return "I didn't understand that :("; //default response
  }
}


exports.respond = respond;
