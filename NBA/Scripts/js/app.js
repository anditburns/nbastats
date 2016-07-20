var app = angular.module("logSearchApp", ['ui.bootstrap', 'ngSanitize']);

	app.factory('APIService', ['$http', function ($http) {

    var urlBase = 'http://stats.nba.com/stats';

    var APIService = {};

	APIService.GetCommonPlayerInfo = function ($scope) {
        return $http.jsonp(urlBase + '/commonplayerinfo', {
            params: {PlayerID: $scope.PlayerID, callback:'JSON_CALLBACK'}
        });
	}
	
	APIService.GetPlayerProfile = function (playerId) {
		  //PerMode = (Total)|(PerGame)|(Per36)
        return $http.jsonp(urlBase + '/playerprofilev2', {
            params: {PlayerID: playerId, PerMode:'PerGame', callback:'JSON_CALLBACK'}
        });
	}
		
	APIService.GetCommonAllPlayers = function () {
        return $http.jsonp(urlBase + '/commonallplayers', {
            params: {LeagueID:'00', Season:'2015-16', IsOnlyCurrentSeason:1, callback:'JSON_CALLBACK'}
        });
    }
	
	APIService.GetGamesVsTeam = function ($scope) {
        return $http.jsonp(urlBase + '/playerdashboardbylastngames', {
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:$scope.PlayerId,Outcome:'',Location:'',Month:0,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:$scope.OpponentTeamID,VsConference:'',VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:'82', callback:'JSON_CALLBACK'}
		});
    }
	
	APIService.GetGamesVsConference = function ($scope) {
        return $http.jsonp(urlBase + '/playerdashboardbylastngames', {
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:$scope.PlayerId,Outcome:'',Location:$scope.Location,Month:0,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:0,VsConference:$scope.OpponentConference,VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:'82', callback:'JSON_CALLBACK'}
		});
    }
	
	APIService.GetGamesInMonth = function ($scope) {
        return $http.jsonp(urlBase + '/playerdashboardbylastngames', {
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:$scope.PlayerId,Outcome:'',Location:$scope.Location,Month:$scope.Month,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:0,VsConference:$scope.OpponentConference,VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:'82', callback:'JSON_CALLBACK'}
		});
    }
	
	
	APIService.GetTeams = function(){
		return $http.get('Data/teams.json').success(function(data) {
         });
	}
	
    return APIService;
}]);

app.controller('SearchLogController', function ($scope, APIService, $uibModal) 
{

	APIService.GetCommonAllPlayers()
		   .success(function (data) 
			   {
					if (data == null || data.length == 0) {				
						$scope.noresultsfound = true;
						//$scope.searchResults = null;
					} else {				
					$scope.headers = data.resultSets[0].headers;								
					$scope.playerInfoBody = data.resultSets[0].rowSet;
				}
			});
 
    $scope.expandedStats = function (items) {

        var modelInstance = $uibModal.open({
            templateUrl: './statsModal.html',
            controller: 'ModalInstanceCtrl',
            windowClass: 'full',
            backdrop: 'static',
            keyboard: false,
            resolve: {
                items: function () {
                    return items;
                }
            }
        });
    };	
});

app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, $sce, items, APIService) {
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
	$scope.notenoughgames = false;
    $scope.finished = false;
	$scope.PlayerId = items[0];
	$scope.TeamIdPlayer = items[3];
	$scope.OpponentTeamID = '';

	
	$scope.search = function () {
		var found = false;
		APIService.GetTeams()
		.success(function (teams)
		{
		   angular.forEach(teams, function (value, key) {
			   if(!found){
				   if(value["simpleName"] == $scope.Opposition){
					   $scope.OpponentTeamID = value["teamId"];
					   found = true;
				   }
			   }
		   });
	
			
		}).then(function ()
		{
			APIService.GetGamesVsTeam($scope)
				.success(function (data) 
				{		
					if (data == null || data.resultSets[0].rowSet.length == 0) {				
						$scope.notenoughgames = true;
						//$scope.searchResults = null;
					} else {
						$scope.headers = data.resultSets[1].headers;
						$scope.playerInfoBody = data.resultSets[0].rowSet;	
						$scope.gamesPlayed = data.resultSets[0].rowSet[0][2]
						
						if($scope.Location == "Home"){
							$scope.l = "@";
						}
						if($scope.Location == "Road"){
							$scope.l = "on the";
						}

						$scope.finished = true;
					}
				})
			
		});
	}
	
	
	$scope.predict = function (vteamstats,margin){
		var d = new Date();
		$scope.Month = d.getMonth()+1;
		//$scope.Month = 11;
		//if($scope.Month == 13){
		//	$scope.Month = 1;
		//}
		var found = false;
		$scope.OpponentConference = '';
		$scope.predictionMade = false;
		
		var pointsAgainstTeam = vteamstats[26];
		var pointsAgainstConference = 0;
		var pointsInMonth = 0;
		
		APIService.GetTeams()
		.success(function (teams)
		{
		   angular.forEach(teams, function (value, key) {
			   if(!found){
				   if(value["simpleName"] == $scope.Opposition){
					   $scope.OpponentConference = value["conf"];
					   found = true;
				   }
			   }	
		   });
		}).then(function ()
		{
				APIService.GetGamesVsConference($scope)
				.success(function (data)
				{
					if (data == null || data.resultSets[0].rowSet.length == 0) {				
								//$scope.notenoughgames = true;
								//$scope.searchResults = null;
					}
					else
					{
						pointsAgainstConference = data.resultSets[0].rowSet[0][26];
					}				
				})
		
		}).then(function ()
		{
			APIService.GetGamesInMonth($scope)
				.success(function (data)
				{
					if (data == null || data.resultSets[0].rowSet.length == 0) {				
								//$scope.notenoughgames = true;
								//$scope.searchResults = null;
					}
					else
					{
						var pointsInMonth = data.resultSets[0].rowSet[0][26];
						var pointsAverage = (pointsAgainstTeam + pointsAgainstConference + pointsInMonth) / 3;
						$scope.PredictedScore =  Math.round(pointsAverage);
						
						if($scope.PredictedScore > margin){
								$scope.PlusMinus = Math.round((Math.round(pointsAverage) / parseInt(margin)) * 100);
						}
						else {
								$scope.PlusMinus = Math.round((parseInt(margin) / Math.round(pointsAverage)) * 100);
						}
						$scope.predictionMade = true;
					}				
				})
				
		});
	
	
     $scope.vsteam = $scope.Opposition;		

	};

});
