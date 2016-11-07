/*global angular*/

angular.module("booksApp", ['ngRoute'])
//create Angular JS app and inject ngRoute module
.config(function($routeProvider){
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
.service("Books", function($http){
    
    this.retrieveBook = function(query){
        
        var url = "getbook/" + query;
        
        return $http.get(url);
        
    };
    
    
})
.service("Login", function($http){
    
    this.isLoggedIn = function(){
      
      return $http.get("/loggedin");  
        
        
    };
    
    
})
.service("Users", function($http){
    
    this.editUser = function(userData){
        
        return $http.post("/edituser", userData)
        //send a http post request to /edituser route Node JS server
            .then(function(response){
                
                return response;
                
            }, function(response){
                
                console.log("Error editing user");          
                
            });
        
    };//this.editUser
    
})
.controller("mainController", function($scope, $rootScope, Login){
//Main controller is loaded on page load or after Passport login    
    
    Login.isLoggedIn()
    //call service that checks on server side if a user is logged in, when controller is loaded
        .then(function(response){
        //server returns '0' when there is no user authenticated 
        //server returns 'req.user' when there is a user authenticated. We use req.user to attach user properties to scope
            
            if(response.data == '0'){
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
            
            
        }, function(response){
            
            console.log("error checking if a user is logged in");
            
            return response;
            
        });
    
    
    
})
.controller('HomeController', function($scope){
//controller for the homepage
    
    console.log("home controller!");
    
})
.controller('MyBooksController', function($scope, Books){
//controller for the Mybooks profile page

        $scope.addBook = function(query){
            
            Books.retrieveBook(query)
            
                .then(function(response){
                
                    var bookObject = {
                        
                        "title": response.data[0].title,
                        "subtitle": response.data[0].subtitle,
                        "authors": response.data[0].authors,
                        "description": response.data[0].description,
                        "link": response.data[0].link,
                        "thumbnail": response.data[0].thumbnail
                    };

                    $scope.book = bookObject;
                    //array of objects, every book is an object
                    
                }, function(response){
                    
                    console.log("failed to retrieve books");
                    
                });
            
            
        };

    
})
.controller('AllBooksController', function($scope){
    
    
    
    
    
})
.controller('ProfileController', function($scope, Users){
    
    $scope.updateUser = function(userData){
    //get the new city and state from front-end form as useData parameter
    //{{"city": "string", "state": "string"}}
        
        $scope.userObject.city = userData.city;
        $scope.userObject.state = userData.state;
        //update $scope properties of userObject to userData
        
        Users.editUser($scope.userObject).then(function(response){
        //call editUser service with edited userObject from scope
        
            console.log("user updated");
            
        }, function(response){
            
            console.log(response);
            
        });
        
    };//$scope.updateUser
    
})
.service('authInterceptor', function($q){
 //service to intercept a 401 response from Express REST API if user is not authenticated for a protected endPoint 
 
    var service = this;
    
    service.responseError = function(response){
    //make a authIntercepter.responseError() method that takes a server response 
    
        if(response.status == 401){
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
