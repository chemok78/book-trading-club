var express = require("express");

require("dotenv").config({

  silent: true

});

var path = require("path");
//use node.js native path module to work with files and paths

var bodyParser = require("body-parser");
//load bodyParser module to parse incoming request bodies, under req.body

var mongodb = require("mongodb");
//use native mongoDB drive, change to Mongoose later

var ObjectID = mongodb.ObjectID;
//load ObjectID method so we can generate new objectID, using objectId = new ObjectID
//ObjectId is a 12-byte BSON type
//MongoDB uses ObjectIds as the default value of _id field of each document which is generated while creation of any document

var passport = require("passport");
//load passport.js

var FacebookStrategy = require('passport-facebook').Strategy;
//load passport.js Facebook strategy

var session = require("express-session");
//load express session

var BOOKS_COLLECTION = "books";

var books = require('google-books-search');
//load Google Books API wrapper for Node JS

var app = express();

app.use(express.static(__dirname + "/public"));
//use express middleware for serving static files from public folder (relative to public folder)

app.use(bodyParser.json());
//parse all requests as JSON in the app instance


mongodb.MongoClient.connect(process.env.DB_URL, function(err, database) {

  if (err) {

    console.log(err);

    process.exit(1);

  }

  db = database;

  console.log("successfully connected to the database");

  var server = app.listen(process.env.PORT || 8080, function() {

    var port = server.address().port;

    console.log("App is now running on port", port);


  });

  /*RESTful API Web services*/

  function handleError(res, reason, message, code) {
    //generic error handling function used by all endpoints    

    console.log("ERROR: " + reason);

    res.status(code || 500).json({

      "error": message

    });

  } //function handleError

  app.use(session({
    secret: 'keyboard cat'
  }));
  //use sessions in Express app instance

  app.use(passport.initialize());
  //initialize passport in Express app instance

  app.use(passport.session());
  //initialize passport sessions and use it in Express app instance

  var db;

  passport.use(new FacebookStrategy({
    //use Facebook strategy with Passport instance

    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_DEV

  }, function(accessToken, refreshToken, user, done) {
    //callback function after successful login

    process.nextTick(function() {
      
      db.collection(BOOKS_COLLECTION).findOne({id: user.id}, function(err,doc){
      //check if user exists in database, find with user.id  
        
        if(err){
        //error handling finding user in database
        
          console.log("error finding user in database");
          
        } else {
          
          if(doc == null){
          //if doc from reading database is null, user does not exist yet in DB
          
           var userObject = user._json;
           
           userObject.city = "";
           userObject.state = "";
           userObject.books = [];  
            
            db.collection(BOOKS_COLLECTION).insertOne(userObject, function(err,doc){
            //insert user in database
            
              if(err){
                
                console.log("error inserting user in database");
                
              } else{
                
                console.log("user inserted in database");
                
              }
              
              
            }); // db.collection(BOOKS_COLLECTION).insertOne
            
          } //if (doc == null)
          
        } //if, else
        
        
      }); // db.collection(BOOKS_COLLECTION).findOne

      done(null, user);
      //return user profile after successfull login
      //if the credentials are valid, the verify callback invokes done to supply Passport with the user that authenticated.

      /*
      {
        _id: '',
        id: '',
        displayName: 'Che Mok',
        state: '',
        city: '',
        books: [
          
          {title: 'javascript', author: 'John Doe', thumbnail: ''},
          
          {title: 'javascript', author: 'John Doe', thumbnail: ''}
          
        
        ]
        
      }
     
      */

    }); //process.nextTick


  })); //passport.use

  passport.serializeUser(function(user, done) {
    //save user object in session
    //result of serializeUser is attached to the session as req.session.passport.user = {};   
    //http://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize

    console.log("user serialized!");

    console.log(user);

    done(null, user);
    //can also be done(null,user.id) if you want to save only the id


  });


  passport.deserializeUser(function(id, done) {
    //retrieve with the key given as obj parameter
    //the fetched object will be attached to req.user

    console.log("user deserialized");

    console.log(id);

    done(null, id);

  });

  /*Facebook Routes*/

  app.get('/auth/facebook', passport.authenticate('facebook'));
  //authenticate with facebook when hitting this route

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    //Handle callback after successfully authenticated with Facebook  

    successRedirect: process.env.FACEBOOK_SUCCESS_REDIRECT_DEVELOPMENT,

    failureRedirect: '/error'

  }));



  app.get('/test', function(req, res, next) {

    //route for testing authentication  

    console.log("check error");

    console.log(req.user);

    console.log(req.isAuthenticated());

    res.send("Error logging in");


  });


  var auth = function(req, res, next) {
    //middleware function to check if user is logged in for every Express request
    //used in Express routes

    if (!req.isAuthenticated()) {

      console.log("You need to login!");

      res.sendStatus(401);
      //send a 401, that will be handled by authInterceptor in Angular JS


    } else {


      console.log("You are logged in");

      next();

    }



  };


  app.get('/loggedin', function(req, res) {
    //route to test if a user is authenticated  
    //is always called when mainController is loaded, so also after Passport login

    if (req.isAuthenticated()) {
      //a user is autenticated  
      //retrieve user object from database
      
      db.collection(BOOKS_COLLECTION).findOne({id: req.user.id}, function(err,doc){
        
        if(err){
          
          handleError(res,err.message, "Failed to retrieve user from database");
          
        } else {
          

          res.status(200).json(doc);
          
          
        }
        
        
      }); //db.collection(BOOKS_COLLECTION)


    } else {
      //no user is authenticated and send a '0' response to front-end  

      res.send('0');

    }


  });

  app.get('/logout', function(req, res) {
    //route to log out user from Facebook login

    req.logout();
    //use Passport JS build in method to log user out and deserialize user

    res.redirect('/');
    //redirect to homepage after log out

  });
  
  app.post('/edituser', function(req,res){
    
    console.log(req.body);
    
    db.collection(BOOKS_COLLECTION).updateOne({id: req.user.id}, req.body, function(err,doc){
      
      if(err){
        
        handleError(res,err.message, "Failed to update user");
        
      } else{
      
        
        res.status(200).end();
        
      }
      
      
    });//db.collection
    
  });


  app.get("/getbook/:query", function(req, res) {
    //retrieve data from Google Books API using the query URL parameter  

    var options = {

      limit: 1

    };

    books.search(req.params.query, options, function(error, results) {

      if (error) {

        console.log(error);

      } else {

        console.log(results);

        res.status(200).json(results);


      }


    });



  });


}); //mongodb.MongoCLient.connect

