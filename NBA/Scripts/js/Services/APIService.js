
angular.module("mainModule").factory("ApiFactor",[function($http){
	
    var urlBase = 'http://stats.nba.com/stats';

    var APIService = {};


	APIService.GetCommonPlayerInfo = function ($scope) {
        return $http.jsonp(urlBase + '/commonplayerinfo', {
            params: {PlayerID: $scope.PlayerID, callback:'JSON_CALLBACK'}
        });
	}
	
	APIService.GetPlayerProfile = function ($scope) {
		  
		  //PerMode = (Total)|(PerGame)|(Per36)
        return $http.jsonp(urlBase + '/playerprofilev2', {
            params: {PlayerID:$scope.PlayerID, PerMode:'PerGame', callback:'JSON_CALLBACK'}
        });
	}
		
	APIService.GetCommonAllPlayers = function ($scope) {
        return $http.jsonp(urlBase + '/commonallplayers', {
            params: {LeagueID:'00', Season:'2015-16', IsOnlyCurrentSeason:1, callback:'JSON_CALLBACK'}
        });
    }
    return APIService;
}]);