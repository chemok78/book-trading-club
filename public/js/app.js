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
       controller: "MybooksController"
        
    });
    
})
.service("Books", function($http){
    
    this.retrieveBook = function(query){
        
        var url = "getbook/" + query;
        
        return $http.get(url);
        
    };
    
    
})
.controller('HomeController', function($scope){
//controller for the homepage
    
    console.log("home controller!");
    
})
.controller('MybooksController', function($scope, Books){
//controller for the Mybooks profile page

        console.log("Mybooks Controller!");

        $scope.addBook = function(query){
            
            Books.retrieveBook(query)
            
                .then(function(response){
                    
                    console.log(response);
                    
                    $scope.book = response;
                    
                }, function(response){
                    
                    
                    console.log("failed to retrieve books");
                    
                })
            
            
        };

    
});
