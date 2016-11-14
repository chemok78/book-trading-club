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
           userObject.traderequests = [];
           userObject.traderequested = [];
            
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
  
  app.post("/editrequests", function(req,res){
  //called from Users.editRequests method to add/remove trade requests  
  //req.body is requestObject with the info for the trade
    
    db.collection(BOOKS_COLLECTION).findOne({id: req.body.ownerID}, function(err,doc){
    //find the user object in database
    
      if(err){
        
        console.log("Could not find user");
        
      } else {
        
        var userID = req.body.ownerID;
        
        delete req.body.ownerID;
        //delete the user ID from requestObject to be inserted in DB
        delete req.body.ownerName;
        //delete the user name from requestObject to be inserted in DB
        
        doc.traderequests.push(req.body);
        
        var updateDoc = doc;
        
        db.collection(BOOKS_COLLECTION).updateOne({id: userID}, updateDoc, function(err,doc){
          
          if(err){
            
            console.log(err);
            
          } else {
            
            res.status(200).end();
            
          }
          
        });
        
      }
      
    });
    
    
  });
  
  app.post("/editrequested", function(req,res){
  //called from Users.editRequested method to add/remove trade requests  
  //req.body is requestedObject with the info for the trade
  
  console.log("checking req.user");
  console.log(req.user);
    
    /*db.collection(BOOKS_COLLECTION).findOne({id:req.user.id}, function(err,doc){
      
      if(err){
        
        console.log("Could not find user");
        
      } else {
        
        doc.traderequested.push(req.body);
        
        var updateDoc = doc;
        
        db.collection(BOOKS_COLLECTION).updateOne({id:req.user.id}, updateDoc, function(err, doc){
          
          if(err){
            
            console.log(err);
            
          } else {
            
            res.status(200).json(doc);
            
          }
          
          
        });
        
      }
      
      
    });*/
    
    db.collection(BOOKS_COLLECTION).findAndModify(
    {id: req.user.id},
    [['_id','asc']],
    {$push: {traderequested: req.body}},
    {new:true}, function(err, doc){
      
      if(err){
        
        console.log(err);
        
      } else {
        
        console.log("database findandmodify successfull!");
        console.log(doc);
        
        res.status(200).json(doc);
        
        
      }
      
      
    });
    
  });
  
  app.post("/acceptrequests", function(req,res){
    
    //we have the the bookObject from the scope:
            //book.author
            //book.title
            //book.requestName
            //book.requestID
            //book.bookOffer: description, link, thumbnail, auhtors, title
            //we have the req.user.id 
        
    
  //Logged in User (JM)/user with book: look myself up in DB with req.user.id. 1) check traderequests: find title: change property Status: "Accepted" (default is pending)
  
  console.log(req.body.title);
  
  db.collection(BOOKS_COLLECTION).update(
    
  {id: req.user.id, "traderequests.title": req.body.title},
  //find the document belonging to req.user.id
  //find in requests array the element that has title same as req.body.title
  
  {$set: 
  
    {"traderequests.$.status": "accepted"}
    
  }, function(err,doc){
    
    
    if(err){
      
      console.log(err);
      
    } else {
      
      console.log("successfully updated status");
      
      
    }
    
  });
  
  
  db.collection(BOOKS_COLLECTION).update(
  //User with request, wants to trade: Look up in DB with requestID: 1) check traderequested: find title: change status  
    
    {id: req.body.requestID, "traderequested.title": req.body.title },
    
    {$set: 
      
      {"traderequested.$.status": "accepted"}
      
    }, function(err,doc){
      
      if(err){
        
        console.log(err);
      
      } else {
        
        res.status(200).json(doc);
        
      }
      
      
    });
  
    
  });
  
  app.post("/declinerequests", function(req,res){
    
    
    console.log(req.body.title);
    
    //Logged in User (JM)/user with book: look myself up in DB with req.user.id. 1) check traderequests: find title: change property Status: "declined" (default is pending)
    
    db.collection(BOOKS_COLLECTION).update(
     //we have the the bookObject from the scope:
     //book.author
     //book.title
     //book.requestName
     //book.requestID
     //book.bookOffer: description, link, thumbnail, auhtors, title
     //we have the req.user.id 
     
     {id: req.user.id, "traderequests.title": req.body.title},
     
     {$set:
     
        {"traderequests.$.status": "declined" }
     
     }, function(err,doc){
       
       if(err){
         
         console.log(err);
         
       } else {
         
         console.log("successfully declined trade requets");
         
       }
       
       
     });//db.collection(BOOKS_COLLECTION).update 
    
    
    db.collection(BOOKS_COLLECTION).update(
      
      {id:req.body.requestID, "traderequested.title":req.body.title},
      
      {$set:
        
        {"traderequested.$.status": "declined"}
        
      }, function(err,doc){
        
        if(err){
          
          console.log(err);
          
        } else {
          
          res.status(200).json(doc);
          
        }
        
      }); //db.collection(BOOKS_COLLECTION).update
    
    
  }); //app.post("/declinerequests"
  
  app.post("/updatebooks", function(req,res){
  //called from Books service and MyBooks controller
  //used for adding books + removing books as well
    
    db.collection(BOOKS_COLLECTION).updateOne({id:req.user.id}, req.body, function(err,doc){
    //find user in database and replace user with userObject from front-end $scope with added book
      
      if(err){
        
        console.log("error updating user with book(s)");
        
      } else {
        
        res.status(200).end;
        
      }
      
      
    });
    
  });
  
  app.get('/getallbooks', function(req,res){
    
    //retrieve all documents from collection in database
    
    //return that to front end and bind to scope
    
    db.collection(BOOKS_COLLECTION).find({}).toArray(function(err,doc){
      
      if(err){
        
        console.log("Error retrieving all books");
        
      } else {
        //loop through doc array, every element/item is a userObject
        
        var booksArray = [ ];
        
        doc.forEach(function(item, index){
        //every item is a userObject  
          
          var booksObject = {};
          
          if(item.books.length > 0){
          //loop through the books array of every user if it's not empty
          
            for(var i= 0; i < item.books.length; i++){
            
               booksObject = item.books[i];
               //set booksObject to item.books from userObject
               booksObject.id = item.id;
               //add id from userObject to booksObject
               booksObject.name = item.name;
               //add name from userObject to booksObject
               
               booksArray.push(booksObject);
            
            }//  for(var i= 0; i < item.books.length
          
         } //if(item.books.length > 0
          
        }); //doc.forEach(function(item, index)
        
        res.status(200).json(booksArray);
        
      } //if, else
      
    }); //db.collection(BOOKS_COLLECTION)
    
    
  }); //app.get('/getallbooks'

  app.get("/getbook/:query", function(req, res) {
    //retrieve data from Google Books API using the query URL parameter  

    var options = {

      limit: 5

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

