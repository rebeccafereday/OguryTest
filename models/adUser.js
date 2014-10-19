var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adUserSchema = new Schema({
    "aaid" : String,
    "viewed_articles"          : [{
        "article_id" : {type : Schema.ObjectId, ref : 'adArticles'}
    }],
    "last_view"        : {type : Date, default : moment().format()},
    "last_visit"       : {type : String, default : moment().format()},
    "total_views"      : {type : Number, default : 0},
    "daily_views"      : {type : Number, default : 0}

});

module.exports = mongoose.model('adUser', adUserSchema, 'adUser');