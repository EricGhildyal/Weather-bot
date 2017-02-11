var HTTPS = require('https');
var request = require('request');

var botID = process.env.BOT_ID;
var defaultCity = 5206379;

function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botRegex = /^\/weather*/g;

  if(request.text && botRegex.test(request.text)) {
    var input = request.text.replace(/\/weather/g, ' '); //strip "/weather "
    this.res.writeHead(200);
    input = input.replace(/^ */g, ""); //remove weird whitespace being added

    city = input;
    console.log("city: "+ city);

    if(city == "help"){ //first thing to check
      postMessage("Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come!");
      return; //end the response early
    }

    if(city == ""){ //if no city given, default to PGH
      city = defaultCity;
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
  city = 2643743; //TODO: get rid of this
  if(city == 2643743){ //handle Pittsburgh default
    cityCode = city;
  }else{
    //check for city code in file
  }

  if(cityCode != -1){
    getWeather(cityCode, function(dat){
      if(dat != undefined){
        function wind(dat){
          var ws = dat.wind.speed;
          if(ws <= 12){ //wind cutoffs from beafort scale
            return "slightly windy";
          }else if(ws <= 24){
            return "windy";
          }else if(ws <= 30){
            return "very windy";
          }else{
            return "very very very windy";
          }
        };
        console.log("wind " + wind(dat));

        function rainOrSnow(dat){
          var resp;
          console.log("dat: " + dat);
          // console.log("dat.snow: " + dat.snow);
          if(dat.rain[0] >= 0){
            resp += "raining";
          }
          if(dat.snow[0] >= 0){
            resp += "snowing";
          }
          return resp + " and";
        };
        console.log("precip: " + rainOrSnow(dat));

        callback("It is currently " +
        Math.round(dat.main.temp) + "F (" +
        Math.round((dat.main.temp-32)*(5/9)) + //calc temp in C
        "C), "+ rainOrSnow(dat) + wind(dat) + "in " + dat.name);
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
  console.log(url);
  request({
  url: url,
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
