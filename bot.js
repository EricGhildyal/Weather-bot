var HTTPS = require('https');
var request = require('request');
var mongoose = require('mongoose');

var botID = process.env.BOT_ID;
var APIKEY = bd26b1ab06a06eae;


function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/weather*/g;

  if(request.text && botRegex.test(request.text)) {
    var input = request.text.replace(/\/weather/g, ' '); //strip "/weather "
    this.res.writeHead(200);
    input = input.replace(/^ */g, ""); //remove weird whitespace being added

    city = input;

    if(city == "help"){ //first thing to check
      postMessage("Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come!");
      return; //end the response early
    }

    if(city == ""){ //if no city given, default to PGH
      city = Pittsburgh;
    }

    processWeather(city, function(response){ //all other cities, process
      postMessage(response);
    });
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

function processWeather(city, callback){ //callback is to send the message
  var cityUpper = city.substring(0,1).toUpperCase() + city.substring(1); //make sure first letter is capitalized
  getWeather(cityCode, function(dat){
    if(dat != undefined){
      callback("It is currently " dat.temperature_string + " in " + dat.display_location.full);
    }else{
      callback("Nothing Found :(");
    }
  });
}

// api call: http://api.wunderground.com/api/bd26b1ab06a06eae/
//function to call weather underground API, callback to processWeather
function getWeather(city, opts, callback){
  var url = "http://api.wunderground.com/api/bd26b1ab06a06eae/conditions/q/pa/pittsburgh";
  var end = ".json"; //default ending for all queries
  console.log(url);
  request({
  url: url+end,
  json: true
  }, function (error, response, body) {
    if (!error) {
      callback(body); //send full JSON back
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
