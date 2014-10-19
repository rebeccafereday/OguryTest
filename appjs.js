/**
 * Created by rebeccafereday on 11/10/2014.
 */

var express    = require('express');
var mongoose   = require('mongoose');
var bodyParser = require('body-parser');
var _          = require('underscore');
var User       = require('./models/adUser.js' );
var Article    = require('./models/adAdvert.js');

mongoose.connect('mongodb://fereday:tesco123@ds031108.mongolab.com:31108/boudica');

var app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

var port = process.env.PORT || 3040;

var router = express.Router();

app.use('/api', router);

router.post('/user', function(req, res){
    //Creates a new User object and sets the values to the object sent in the request body
    var user = new User();
    _.extend(user, req.body);

    //Check that the request object contains a aaid
    if(user.aaid){

        //Checks the user table for a record matching the aaid sent in the body. The response will only contain the id of the record
        User.findOne({"aaid" : req.body.aaid}, {_id : 1}, function(findUserErr, findUserRes){

            //Checks if the request returns an error and returns it if it does
            if(findUserErr){
                res.send(findUserErr);
            }

            //Checks if the response object contains any data
            else if(!findUserRes){
                //If the response returned no data the user doesn't exisit so saves the new user object to the User table
                user.save(function(saveUserErr, saveUserRes){
                    if(saveUserErr) {
                        res.send(saveUserErr);
                    }
                    else {
                        res.send({_id : saveUserRes._id});
                    }
                })
            }

            //If the response contains data this is returned. It should only include the _id as this was the only parameter requested in the query.
            else {
                res.send(findUserRes);
            }
        })
    }

    //If no aaid is sent the response body contains details of the error.
    else {
        res.status(200).send({error : 400, body : "All requests must contain an aaid in the body"});
    }
});

router.get('/article/:id', function(req, res){
    var userId = req.params.id;
    var date = new Date();

    //Returns the number of days and hours since 1970, this can be used to do date comparison in or query
    var day   = Math.floor(date.getTime()/86400000);
    var hour = Math.floor(date.getTime()/3600000);
    var four_hours_ago = hour - 14400000;

    //Returns an array of article_ids viewed by user
    User.findOne({_id : userId}, function(find_users_err, find_users_res){
        if(find_users_err){
            res.send(find_users_err);
        }
        else {
            if(find_users_res){
                //Creates an array of _ids that have been viewed by the user.
                var viewed_article_ids = _.map(find_users_res.viewed_articles, function(val){
                    return val.article_id;
                })

                Article.find({$and : [{_id : {$nin : viewed_article_ids}}, //all records not contained in the list of viewed articles returned by the user
                    {total_views: {$lt : 10}}, // all records that have been viewed less than 10 times
                    {last_visit_hours: {$lt : four_hours_ago}}, // all records that have been viewed more than 4 hours ago
                    { $or : [ {last_visit_day: {$lt : day}}, // all records not viewed today
                        { $and : [ {last_visit_day: day}, // all records viewed today less than three times
                            { daily_views: {$lt : 3}}
                        ]}
                    ]}
                ]},
                    Article.findOne({_id : "543af778392e93b96fbc0939"},function(find_articles_err, find_articles_res){
                    if(find_articles_err){
                        res.send(find_articles_err);
                    }
                    else {
                        //If articles are returned from the query, they are counted and a random article is selected.
                        if(!find_articles_res){
                            res.send({error : 404, body : "No articles were found for this user"});
                        }
                        else {
                            var x = find_articles_res.count;
                            var rand = Math.floor(Math.random() * x);
                            var article = find_articles_res[rand];

                            //If the last time the article was viewed was today the daily count is incremented by one
                            if(article.last_visit_day == day){
                                article.daily_views ++;
                            }
                            //If the last time the article was viewed was before today the count is reset to one.
                            else {
                                article.daily_views = 1;
                            }

                            article.last_visit_day = day;
                            article.last_visit_hours = hours;
                            article.last_view = date;
                            article.total_views ++;

                            //The updates to the article are saved to the database
                            article.save(function(save_article_err, save_article_res){
                                if(save_article_err){
                                    res.send(save_article_err);
                                }
                                else {
                                    //If the article is updated successfully, the article id is pushed to the viewed_article array on the user and then saved.
                                    find_users_res.viewed_articles.push(save_article_res._id);
                                    find_users_res.save(function(save_user_err, save_user_res){
                                        if(save_user_err){
                                            res.send(save_user_err);
                                        }
                                        else {
                                            //The article information is returned in the response.
                                            res.send({"ad" : {"id" : save_article_res._id, "name" : save_article_res.name}});
                                        }
                                    })

                                }
                            })


                        }

                    }
                })
            }

        }
    })



});

app.listen(port);

console.log("Listening on port " + port);