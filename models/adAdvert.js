var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adAdvertSchema = new Schema({
    "name"             : String
});

module.exports = mongoose.model('adAdvert', adAdvertSchema, 'adAdvert');