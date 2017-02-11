var mongoose       = require('mongoose');
var Schema         = mongoose.Schema;

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

module.exports = cityModel;
