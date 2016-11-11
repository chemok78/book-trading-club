$scope.acceptRequest = function(book){
        //we have the the bookObject from the scope:
            //book.author
            //book.title
            //book.requestName
            //book.requestID
            //book.bookOffer: description, link, thumbnail, auhtors, title
        //we have the req.user.id in Node JS server side
        
        //I am JM
        //To try with CM

        //Logged in User: look myself up in DB with req.user.id. 1) check traderequests: find title: change property Status: "Accepted" (default is pending)
        //User with book: look user up in DB with book.requestID 1) check traderequested: find title change property Status: to "Accepted" (default is pending)
            
            Users.acceptRequests(book)
                .then(function(response){
                    
                    console.log(response);
                    
                }, function(response){
                    
                    console.log("Error updating database with acceptRequest");      
                    
                });
            
        };

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

db.collection(BOOKS_COLLECTION).findOne({id: req.user.id}, function(err,doc){
        
        if(err){
          
          handleError(res,err.message, "Failed to retrieve user from database");
          
        } else {
          

          res.status(200).json(doc);
          
          
        }
        
        
      }); //db.collection(BOOKS_COLLECTION)