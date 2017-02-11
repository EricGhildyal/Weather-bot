var HTTPS = require('https');
var request = require('request');
var mongoose    = require('mongoose');

var botID = process.env.BOT_ID;
var mongoURI = process.env.MONGODB_URI;
var defaultCity = 5206379;

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
  if(city == defaultCity){ //handle Pittsburgh default
    cityCode = city;
  }else{
    var cityUpper = city.substring(0,1).toUpperCase() + city.substring(1); //make sure first letter is capitalized
    console.log("cityUpper: " + cityUpper);

    //mongo code starts here
    mongoose.connect(mongoURI);
    var db = mongoose.connection;
    db.on('error', function(err){
      console.log("Connection to DB failed " + err);
    });
    db.on('open', function (){
      console.log("Db connected");
      var Schema = mongoose.Schema;
      var citySchema = new Schema({
        "_id": Number,
        "name": String,
        "country": String,
        "coord": {
            "lon": Number,
            "lat": Number
        }
      });
      var cityModel = mongoose.model('cityModel', citySchema);
      cityModel.find({'name': cityUpper}, '_id', function(err, id){
        if(err){
          console.log(err);
          return -1;
        }
        console.log("id:" + id);
        return id;

      });
      mongoose.disconnect();
    });
    //end mongo code
  }

  if(cityCode != -1){
    getWeather(cityCode, function(dat){
      if(dat != undefined){
        //get human readable version of rain or snow
        function rainOrSnow(dat){
          //turn JSON into string, strip all non-ints and remove the first number (3)
          var rain = (dat.rain == undefined) ? -1 : JSON.stringify(dat.rain).replace(/[\D.]/g, '').substring(1);
          var snow = (dat.snow == undefined) ? -1 : JSON.stringify(dat.snow).replace(/[\D.]/g, '').substring(1);

          if(rain != -1 && rain >= 0.5){ //more than .5" of rain
            return ", raining";
          }
          if(snow != -1 && snow > 0){ //more than 0" of snow
            return ", snowing";
          }
          return "";
        };

        //get a human readable version of the windspeed
        function wind(dat){
          if(dat.wind == undefined) return;
          var ws = dat.wind.speed;
          if(ws >= 30){ //wind cutoffs from beafort scale
            return " and very very very windy"
          }else if(ws >= 23){
            return " and very windy";
          }else if(ws >= 15){
            return " and windy";
          }else if(ws >= 8){
            return " and slightly windy";
          }else{
            return "";
          }
        };

        callback("It is currently " +
        Math.round(dat.main.temp) + "F (" +
        Math.round((dat.main.temp-32)*(5/9)) + //calc temp in C
        "C)" + rainOrSnow(dat) + wind(dat) + " in " + dat.name);
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
  //console.log(url);
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
