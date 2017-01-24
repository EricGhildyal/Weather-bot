var HTTPS = require('https');

var botID = process.env.BOT_ID;
var apiKey = process.env.API_KEY;

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

// api call: http://api.openweathermap.org/data/2.5/weather?id=cityCode&units=imperial&appid=apiKey
function getWeather(city){
  var dat = null;
  // console.log(cityList[1]);
  city = city.replace(/^ */g, ""); //remove weird whitespace being added
  // console.log(city);
  if(city == "help"){ //first thing to check
    return "Default city is Pittsburgh \n Use /weather [city] for other cities \n More features to come!";
  }

  var cityCode = -1;
  cityCode = 1283240;
  //check for city code in file

  if(cityCode != -1){ //make sure city code was set
    var options = {
      host: 'api.openweathermap.org/data/2.5',
      port: 80,
      path: '/weather?id=' + cityCode + '&units=imperial&appid=' + apiKey
      method: 'POST'
    }
    http.request(options, function(res) {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        dat = chunk;
      });
      req.on('error', (e) => {
        return "There was an error getting the data for " + city;
      });
    }).end();
  }else{
    return "I didn't understand that :("; //default response
  }

  if(dat != null){
    return dat.main.temp;
  }else{
    return "There was an unspecified error";
  }

}


exports.respond = respond;
