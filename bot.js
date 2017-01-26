var HTTPS = require('https');
var request = require('request');

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

  botResponse = processWeather(city);
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

// api call: http://api.openweathermap.org/data/2.5/weather?id=cityCode&units=imperial&appid=apiKey
function processWeather(city){
  var dat = null;
  city = city.replace(/^ */g, ""); //remove weird whitespace being added
  if(city == "help"){ //first thing to check
    return "Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come!";
  }

  if(city == " "){
    console.log("Defaulted to PGH!!!!");
    //default to pittsburgh
  }

  var cityCode = -1;
  cityCode = 1283240; //Kathmandu example
  //check for city code in file

  if(cityCode != -1){ //make sure city code was set
    console.log("URL: " + url);
    getWeather(cityCode, function(body){ //cal api, wait for callback
      dat = body;
    });
  }else{
    return "I didn't understand that :("; //default response
  }
  console.log("dat: " + dat);
  if(dat != null){
    return dat.main.temp;
  }else{
    return "Nothing was returned"; //"There was an unspecified error"
  }

}

function getWeather(cityCode, callback){
  var url = "http://api.openweathermap.org/data/2.5/weather?id=" + cityCode + "&units=imperial&appid=aa18b5edfa68b9272ef1cd13f4602abe";
  request({
  url: url,
  json: true
  }, function (error, response, body) {
    if (!error) {
      console.log("body: " + body);
      callback(body);
    }else{
      return "Error " + response.statusCode;
    }
  })
}


exports.respond = respond;
