var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var adUserSchema = new Schema({
    "aaid" : String,
    "viewed_articles"          : [{
        "article_id" : {type : Schema.ObjectId, ref : 'adArticles'}
    }],
    "last_view"        : {type : Date, default : Date.now},
    "last_visit_day"   : {type : Number, default : 0},
    "last_visit_hours" : {type : Number, default : 0},
    "total_views"      : {type : Number, default : 0},
    "daily_views"      : {type : Number, default : 0}

});

module.exports = mongoose.model('adUser', adUserSchema, 'adUser');