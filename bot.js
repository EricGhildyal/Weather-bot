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
    console.log(input);
    var opts = input.split(" ");
    console.log("opts: " + opts);
    var city = opts[0]; //city is the first, always set it
    var type = NULL; // type of forecast
    if(opts.length > 1){
      type = opts[1]; //type is optional and should be the second
    }
    if(city == "help"){ //first thing to check
      postMessage("Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come!");
      return; //end the response early
    }

    if(city == ""){ //if no city given, default to PGH
      console.log("Defaulted to PGH!!!!");
      city = 5206379;
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

// api call: http://api.openweathermap.org/data/2.5/weather?id=cityCode&units=imperial&appid=apiKey
function processWeather(city, callback){ //callback is to send the message
  var cityCode = -1;
  if(city = 5206379){ //handle Pittsburgh default
    cityCode = city;
  }else{
    //check for city code in file
  }

  if(cityCode != -1){ //make sure city code was set
    getWeather(cityCode, function(dat){ //cal api, wait for callback
      if(dat != undefined){
        callback("It is currently " + Math.round(dat.main.temp) + "F in " + dat.name); //form the full message to be sent (rounding temp to nearest int)
      }else{
        callback("Nothing Found :(");
      }
    });
  }else{
    callback("I don't know what " + city + " is..."); //default response
  }
}
 //function to call openwaethermap API, callback to processWeather
function getWeather(cityCode, callback){
  var url = "http://api.openweathermap.org/data/2.5/weather?id=" + cityCode + "&units=imperial&appid=aa18b5edfa68b9272ef1cd13f4602abe";
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
