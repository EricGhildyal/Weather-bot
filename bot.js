var HTTPS = require('https');
var request = require('request');

var botID = process.env.BOT_ID;

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/weather*/g;

  if(request.text && botRegex.test(request.text)) {
    var input = request.text.replace(/\/weather/g, ' '); //strip "/weather "
    this.res.writeHead(200);
    input = input.replace(/^ */g, ""); //remove weird whitespace being added
    input = input.toLowerCase();
    inputs = input.split(/,?\s+/); //split by comma or space
    console.log("inputs: " + inputs.toString());
    var city = "";
    var stateOrCountry = ""
    if(inputs.length == 2){
        city = inputs[0];
        stateOrCountry = inputs[1];
    }else{
      postMessage("Please enter [City], [State/Country]");
      return;
    }

    if(inputs.length == 0){ //no input, default to PGH
      city = "pittsburgh";
      stateOrCountry = "pa"
    }

    if(city == "help"){ //first thing to check
      postMessage("Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come! (Weather API from weatherunderground)");
      return;
    }

    processWeather(city, stateOrCountry, function(response){ //all other cities, process
      postMessage(response);
    });
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function processWeather(city, stateOrCountry, callback){ //callback is to send the message
  getWeather(city, stateOrCountry, function(dat){
    if(dat != undefined){
      var wind = (function(dat){
        if(dat.wind_mph == undefined) return;
        var ws = dat.wind_mph;
        if(ws >= 30){ //wind cutoffs from beafort scale
          return " and very very very windy"
        }else if(ws >= 23){
          return " and very windy";
        }else if(ws >= 15){
          return " and windy";
        }else if(ws >= 8){
          return " and slightly windy";
        }else{
          return;
        }
      })(dat); //pass var into method
      callback("It is currently "+ dat.weather + ", " + dat.temperature_string + wind +  " in " + dat.display_location.full);
    }else{
      callback("Nothing Found :(");
    }
  });
}

// api call: http://api.wunderground.com/api/bd26b1ab06a06eae/
//function to call weather underground API, callback to processWeather
function getWeather(city, stateOrCountry, callback){
  var url = "http://api.wunderground.com/api/bd26b1ab06a06eae/conditions/q/" + stateOrCountry + "/" + city;
  var end = ".json"; //default ending for all queries
  var url = url + end; //append ending
  console.log("url:" + url);
  request({
  url: url,
  method: 'GET',
  json: true
  }, function (error, response, body) {
    if (!error) {
      callback(body.current_observation); //send full JSON back
    }else{
      console.log("Error " + response.statusCode);
    }
  })
}


function postMessage(resp) {
  var botResponse, options, body, botReq;

  botResponse = resp;

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

exports.respond = respond;
