var express = require("express");

require("dotenv").config({
    
   silent:true
    
});

var path = require("path");
//use node.js native path module to work with files and paths

var bodyParser = require("body-parser");
//load bodyParser module to parse incoming request bodies, under req.body

var mongodb = require("mongodb");
//use native mongoDB drive, change to Mongoose later

var BOOKS_COLLECTION = "books";

var app = express();

app.use(express.static(__dirname + "/public"));
//use express middleware for serving static files from public folder (relative to public folder)

app.use(bodyParser.json());
//parse all requests as JSON in the app instance

var db;

mongodb.MongoClient.connect(process.env.DB_URL, function(err,database){
    
    if(err){
        
        console.log(err);
        
        process.exit(1);
        
    }
    
    db = database;
    
    console.log("successfully connected to the database");
    
    var server = app.listen(process.env.PORT || 8080, function(){
        
        var port = server.address().port;
        
        console.log("App is now running on port", port);
        
        
    });
    
    /*RESTful API Web services*/
    
    function handleError(res,reason, message, code){
    //generic error handling function used by all endpoints    
        
        console.log("ERROR: " + reason);
    
        res.status(code || 500).json({
        
        "error": message
        
        });
    
    }//function handleError
    
    
    
});//mongodb.MongoCLient.connect