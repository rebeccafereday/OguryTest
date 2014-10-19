_          = require("underscore")
moment     = require("underscore")

express    = require("express")
mongoose   = require("mongoose")
bodyParser = require("body-parser")

User       = require("../models/adUser.js")
Advert    = require("../models/adAdvert.js")

mongoose.connect "mongodb://fereday:tesco123@ds031108.mongolab.com:31108/boudica"

app = express()
app.use bodyParser.urlencoded(extended: false)
app.use bodyParser.json()

port = process.env.PORT or 3040
router = express.Router()

app.use "/api", router

router.post "/user", (req, res) ->
  ##Creates a new user object
  user = new User()
  _.extend user, req.body

  ##Checks if the user object contains an aaid
  if user.aaid

    ##Looks in the user collection for a user object with the same aaid
    User.findOne aaid : req.body.aaid, (findUserErr, findUserRes)->

      ##Checks if there is an error and returns it
      if findUserErr
        res.send code : 500, body : findUserErr

      ##Checks if no user is returned
      else unless findUserRes?
        ##Saves the user object passed in the request body
        user.save (saveUserErr, saveUserRes) ->

          ##Checks if there is an error and returns it
          if saveUserErr
            res.send code : 500, body : saveUserErr

          ##Returns the user
          else
            res.send code : 200, body : saveUserRes
        return

      ##Returns the user if one is already stored in the collection matching the aaid
      else
        res.send code : 200, body : findUserRes
    return

  ##Returns the following message if no aaid is provided
  else
    res.send code : 400, body : "Please include an aaid in the request body object"


router.get "/add/:id", (req, res) ->
  userID = req.params.id

  now = moment()
  four = moment().add(4, 'hours')

  ##Finding the user matching the id passed in the query
  User.findOne _id : userID, (findUserErr, findUserRes) ->

    ##Returning the error if there is one
    if findUserErr
      res.send code : 500, body : findUserErr

    ##If findUserRes is not null
    else if findUserRes?

      ##Check whether the user has seen an article in the last 4 hours, checking whether they have seen ten articles in total and whether they have seen three articles today.
      if now.isBefore(four)  and findUserRes.total_views < 10 and 
      ((moment(findUserRes.last_visit).isSame(now, 'days') and findUserRes.daily_views < 3) or 
      !moment(findUserRes.last_visit).isSame(now, 'days'))

        ##If the user is eligible to view an advert all articles not yet been viewed by the user are returned
        Advert.find _id : $nin : findUserRes.viewed_articles, (findAdvertErr, findAdvertRes) ->

          ##Returns an error if there is one.
          if findAdvertErr
            res.send code : 500, body : findAdvertErr

          ##Checks if any advert were returned
          else if findAdvertRes.length > 0

            ##A random advert is selected
            count = findAdvertRes.length
            rand = Math.floor Math.random() * count
            advert = findAdvertRes[rand]

            ##The user's details are updated
            if findUserRes.last_visit).isSame(now, 'days')
              findUserRes.daily_views = 1
            else
              findUserRes.daily_views++
            findUserRes.last_visit = now.format()
            findUserRes.total_views++
            findUserRes.viewed_articles.push advert._id

            ##The user is saved to the db
            findUserRes.save (saveUserErr, saveUserRes) ->

              ##Checks if there is an error and returns ir
              if saveUserErr
                res.send code : 500, body : saveUserErr

              ##Returns the article
              else
                res.send code : 200, body : advert
              return

          ##If there are no more adverts for the user to view a message is returned
          else
            res.send code : 204, body : "User has viewed all adverts"
            return
        return

      ##If the user has seen more than 10 adverts, 3 today or seen one in the last four hours the message below is returned
      else
        res.send code : 204, body : "No adds to show currently for this user"
        return

    ##If there is no user matching the id the following message is returned
    else
      res.send code : 404, body : "No user matching this id"
    return

router.post "/add", (req, res) ->
  advert = new Advert()
  _.extend advert, req.body

  advert.save (saveAdvertErr, saveAdvertRes)->
    if saveAdvertErr
      res.send saveAdvertErr
    else
      res.send saveAdvertRes
    return


app.listen port

console.log "Listening on port " + port