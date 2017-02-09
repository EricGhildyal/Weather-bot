var HTTPS = require('https');
var request = require('request');

var botID = process.env.BOT_ID;
var defaultCity = 5206379; // set your defult city's code here

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/weather*/g;

  if(request.text && botRegex.test(request.text)) {
    this.res.writeHead(200);
    var input = request.text.replace(/\/weather/, ' '); //strip "/weather "
    input = input.replace(/^ */, ""); //remove weird whitespace being added

    var opts = input.split(" ");
    console.log("opts: " + opts);
    var city = opts[0]; //city is the first, always set it
    var type = null; // type of forecast

    if(opts.length > 1){
      type = opts[1]; //type is optional and should be the second
      type = type.toLowerCase();
    }

    if(city == "help"){ //first thing to check
      postMessage("Default city is Pittsburgh \n Use /weather [city] for other cities \n use '2day' or '5day' to get a longer forecast ");
      return;
    }

    if(city == ""){ //default to global var
      type = city; //there was no city given, so the type ends up being in the city var
      city = defaultCity;
    }

    console.log("type: " + type);

    var len = -1;

    if(type == "2day" || type == "2-day"){
      console.log("2 day selected");
      len = 2;
    }

    if(type == "5day" || type == "5-day"){
      console.log("5 day selected");
      len = 5;
    }


    processWeather(city, len, function(response){ //all other cities, process
      postMessage(response);
    });
    this.res.end();
  } else {
    console.log("don't care");
    this.res.writeHead(200);
    this.res.end();
  }
}

// api call: http://api.openweathermap.org/data/2.5/weather?id=cityCode&units=imperial&appid=apiKey
function processWeather(city, len, callback){ //callback is to send the message
  var cityCode = -1;
  //check for city code in file
  if(city == defaultCity){ //handle default city
    cityCode = defaultCity;
  }


  if(cityCode != -1){ //make sure city code was set
    getWeather(cityCode, len, function(dat){ //cal api, wait for callback
      if(dat != undefined){
        callback("It is currently " + Math.round(dat.main.temp) + "F (" + Math.round((dat.main.temp-32)*(5/9)) + "C) in " + dat.name); //form the full message to be sent (rounding temp to nearest int)
      }else{
        callback("Nothing Found :(");
      }
    });
  }else{
    callback("I don't know what " + city + " is..."); //default response
  }
}
 //function to call openwaethermap API, callback to processWeather
function getWeather(cityCode, len, callback){
  var url = "http://api.openweathermap.org/data/2.5/weather?id=" + cityCode + "&units=imperial&appid=aa18b5edfa68b9272ef1cd13f4602abe";
  if(len == 2){

  }else if(len==5){

  }
  request({
  url: url,
  json: true
  }, function (error, response, body) {
    console.log(url);
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
