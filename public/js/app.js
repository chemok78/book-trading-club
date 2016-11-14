/*global angular*/

angular.module("booksApp", ['ngRoute'])
  //create Angular JS app and inject ngRoute module
  .config(function($routeProvider) {
    $routeProvider
      .when("/", {
        templateUrl: "home.html",
        controller: "HomeController"
      })
      .when("/mybooks", {

        templateUrl: "mybooks.html",
        controller: "MyBooksController"

      })
      .when("/allbooks", {

        templateUrl: "allbooks.html",
        controller: "AllBooksController"

      })
      .when("/profile", {

        templateUrl: "profile.html",
        controller: "ProfileController"

      })

  })
  .service("Books", function($http) {

    this.retrieveBook = function(query) {

      var url = "getbook/" + query;

      return $http.get(url);

    };

    this.updateBook = function(user) {
      //called from MyBooks controller with userObject  

      return $http.post("/updatebooks", user);
      //post to /updatebooks route with user as parameter

    }; //this.enterBook

    this.allBooks = function() {

      return $http.get("/getallbooks");

    };


  })
  .service("Login", function($http) {

    this.isLoggedIn = function() {

      return $http.get("/loggedin");


    };


  })
  .service("Users", function($http) {

    this.editUser = function(userData) {

      return $http.post("/edituser", userData)
        //send a http post request to /edituser route Node JS server
        .then(function(response) {

          return response;

        }, function(response) {

          console.log("Error editing user");

        });

    }; //this.editUser

    this.editRequests = function(requestObject) {

      return $http.post("/editrequests", requestObject)
        .then(function(response) {

          return response;

        }, function(response) {

          console.log("Error editing request object");

        });

    };

    this.editRequested = function(requestedObject) {

      return $http.post("/editrequested", requestedObject)
        .then(function(response) {

          return response;

        }, function(response) {

          console.log("Error editing requested object");
        });
    };


    this.acceptRequests = function(bookObject) {

      return $http.post("/acceptrequests", bookObject)
        .then(function(response) {

          return response;

        }, function(response) {

          console.log("error accepting requests by calling RESTful API");

        });

    };

    this.declineRequests = function(bookObject) {

      return $http.post("/declinerequests", bookObject)
        .then(function(response) {

          return response;

        }, function(response) {

          console.log("error declining requests by calling RESTful API");
        });

    }

  })
  .controller("mainController", function($scope, $rootScope, Login) {
    //Main controller is loaded on page load or after Passport login    

    Login.isLoggedIn()
      //call service that checks on server side if a user is logged in, when controller is loaded
      .then(function(response) {
        //server returns '0' when there is no user authenticated 
        //server returns 'req.user' when there is a user authenticated. We use req.user to attach user properties to scope

        if (response.data == '0') {
          //no user is logged in    

          console.log("no user is logged in");

          $scope.loggedIn = false;

        } else {

          console.log("we found a user");
          console.log(response.data);


          $scope.userObject = response.data;
          delete $scope.userObject._id;
          //delete ._id created by MongoDB from userObject
          $scope.loggedIn = true;
          //$scope.userID = response.data.id;
          //$scope.displayName = response.data.name;
          //$scope.city = response.data.city;
          //$scope.state = response.data.state;
          //$scope.books = response.data.books;

        }


      }, function(response) {

        console.log("error checking if a user is logged in");

        return response;

      });



  })
  .controller('HomeController', function($scope) {
    //controller for the homepage

    console.log("home controller!");

  })
  .controller('MyBooksController', function($scope, $window, Books, Users) {
    //controller for the Mybooks profile page

    $scope.retrieveBooks = function(query) {

      Books.retrieveBook(query)

      .then(function(response) {
        //response.data is an array of book objects/
        //loop through array and select items needed

        var booksArray = [];

        response.data.forEach(function(item) {

          var bookObject = {

            "title": item.title,
            "subtitle": item.subtitle,
            "authors": item.authors,
            "description": item.description,
            "link": item.link,
            "thumbnail": item.thumbnail
          };

          booksArray.push(bookObject);

        });

        $scope.books = booksArray;
        //array of objects, every book is an object

      }, function(response) {

        console.log("failed to retrieve books");

      });


    };

    $scope.addBook = function(book) {
      //function to add a book from front-end
      //book paramater sends a book object

      $scope.userObject.books.push(book);
      //add the book object to the books array in the userObject initialized in $scope in mainController

      Books.updateBook($scope.userObject)
        //send userObject with book added to the Books service to call RESTful API
        .then(function(response) {

          console.log("successfully updated book");

        }, function(response) {

          console.log("failed to add book");

        });


    };


    $scope.removeBook = function(book) {
      //called from front-end with book to be deleted from user

      $scope.userObject.books.forEach(function(item, index) {
        //edit scope userObject first before saving to database
        //loop through the book object and check if book titles are the same.

        if (item.title === book.title) {

          $scope.userObject.books.splice(index, 1);
          //delete book from scope.userObject first

          Books.updateBook($scope.userObject);


        }

      });


    };

    //Accept trade request here

    $scope.acceptRequest = function(book) {
      //we have the the bookObject from the scope:
      //book.author
      //book.title
      //book.requestName
      //book.requestID
      //book.bookOffer: description, link, thumbnail, auhtors, title
      //we have the req.user.id in Node JS server side

      //Logged in User: look myself up in DB with req.user.id. 1) check traderequests: find title: change property Status: "Accepted" (default is pending)
      //User with book: look user up in DB with book.requestID 1) check traderequested: find title change property Status: to "Accepted" (default is pending)

      Users.acceptRequests(book)
        .then(function(response) {

          $window.location.reload();

        }, function(response) {

          console.log("Error updating database with acceptRequest");

        });

    };

    $scope.declineRequest = function(book) {
      //we have the the bookObject from the scope:
      //book.author
      //book.title
      //book.requestName
      //book.requestID
      //book.bookOffer: description, link, thumbnail, auhtors, title
      //we have the req.user.id in Node JS server side    

      Users.declineRequests(book)
        //Logged in User: look myself up in DB with req.user.id. 1) check traderequests: find title: change property Status: "declined" (default is pending)
        //User with book: look user up in DB with book.requestID 1) check traderequested: find title change property Status: to "declined" (default is pending)

      .then(function(response) {

        $window.location.reload();


      }, function(response) {

        console.log("error updating database with declineRequest");

      });

    };


  })
  .controller('AllBooksController', function($scope, $window, Books, Users) {

    Books.allBooks()
      //use allBooks to call server side RESTful API to retrieve all books in database
      //returns an array of objects, each object is a book including id and name of user
      .then(function(response) {

        $scope.allUserBooks = response.data;
        //bind allUserBooks array to the scope

      }, function(response) {

        console.log("Error retrieving all books");

      });

    $scope.setBook = function(book) {
      //set the book that is selected from all books list the user wants to trade    
      $scope.tradeBook = book;

    };

    $scope.sendTrade = function(trade) {
      //function to actually send a trade request       
      //$scope.userObject is current set and all books   
      //$scope.tradeBook is book of other user to be traded

      //construct request object for the user that owns the book

      var requestObject = {};

      requestObject.requestID = $scope.userObject.id;
      //the user id that requests the trade
      requestObject.requestName = $scope.userObject.name;
      //the user name that requests the trade
      requestObject.title = $scope.tradeBook.title;
      //the title of the book that is requested to trade
      requestObject.author = $scope.tradeBook.authors[0];
      //the author of the book that is requested to trade
      requestObject.bookOffer = trade;
      requestObject.ownerID = $scope.tradeBook.id;
      requestObject.ownerName = $scope.tradeBook.name;
      requestObject.status = "pending";


      Users.editRequests(requestObject)
        .then(function(response) {

          console.log("Successfully send trade request to user");

        }, function(response) {

          console.log("Error editing request object");

        });

      //construct requestedObject for user that wants to trade the book

      var requestedObject = {};

      requestedObject.title = $scope.tradeBook.title;
      //the book title the user wants to trade
      requestedObject.author = $scope.tradeBook.authors[0];
      requestedObject.bookOffer = trade;
      requestedObject.ownerID = $scope.tradeBook.id;
      requestedObject.ownerName = $scope.tradeBook.name;
      requestedObject.status = "pending";

      Users.editRequested(requestedObject)
        .then(function(response) {

          $scope.userObject = response.data.value;

          $window.location.reload();


        }, function(response) {

          console.log("Error adding trade request to my database");

        });



    }; //$scope.sendTrade


  })
  .controller('ProfileController', function($scope, Users) {

    $scope.updateUser = function(userData) {
      //get the new city and state from front-end form as useData parameter
      //{{"city": "string", "state": "string"}}

      $scope.userObject.city = userData.city;
      $scope.userObject.state = userData.state;
      //update $scope properties of userObject to userData

      Users.editUser($scope.userObject).then(function(response) {
        //call editUser service with edited userObject from scope

        console.log("user updated");

      }, function(response) {

        console.log(response);

      });

    }; //$scope.updateUser

  })
  .service('authInterceptor', function($q) {
    //service to intercept a 401 response from Express REST API if user is not authenticated for a protected endPoint 

    var service = this;

    service.responseError = function(response) {
      //make a authIntercepter.responseError() method that takes a server response 

      if (response.status == 401) {
        //if response error status is 401 redirect to login URL 

        window.location = "/auth/facebook";

      }

      return $q.reject(response);
      //if the response error status is something other than 401 reject the promise with the response

    };


  })
  .config(['$httpProvider', function($httpProvider) {
    //add authInterceptor service to httpProvider so its used in    

    $httpProvider.interceptors.push('authInterceptor');
  }]);
