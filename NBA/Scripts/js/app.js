var app = angular.module("logSearchApp", ['ui.bootstrap', 'ngSanitize']);

	app.factory('APIService', ['$http', function ($http) {

    var urlBase = 'http://stats.nba.com/stats';

    var APIService = {};

	APIService.GetCommonPlayerInfo = function (playerId) {
        return $http.jsonp(urlBase + '/commonplayerinfo', {
            params: {PlayerID: playerId, callback:'JSON_CALLBACK'}
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
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:$scope.PlayerId,Outcome:'',Location:'',Month:0,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:$scope.OpponentTeamID,VsConference:'',VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:'0', callback:'JSON_CALLBACK'}
		});
    }
	
	APIService.GetGamesVsConference = function ($scope) {
        return $http.jsonp(urlBase + '/playerdashboardbylastngames', {
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:$scope.PlayerId,Outcome:'',Location:'',Month:0,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:0,VsConference:$scope.OpponentConference,VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:0, callback:'JSON_CALLBACK'}
		});
    }
	
	APIService.GetTeams = function(){
		return $http.get('Data/teams.json').success(function(data) {
         });
	}
	
	APIService.GetGlobalNBAStats = function (playername){
			return  $http.get('http://au.global.nba.com/stats2/player/stats.json?ds=splits&locale=au&playerCode='+playername).success(function(data){
				//params:{ds:'splits', locale:'au', playerCode:player, callback:'JSON_CALLBACK'}
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
	$scope.teamname = items[11];
	$scope.OpponentTeamID = '';
	$scope.PlayerName = items[2];
	$scope.playername_ = items[6];
	
	GetCommonPlayerInfo();
	
	function GetCommonPlayerInfo(){
		
		APIService.GetCommonPlayerInfo(items[0])
		.success(function (data)
		{
			$scope.JerseyNum =  data.resultSets[0].rowSet[0][13];	
			$scope.Position = data.resultSets[0].rowSet[0][14];	
			$scope.CareerPointsAvg = data.resultSets[1].rowSet[0][3];
		});			
	}
	
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
						$scope.nogamesagainstopponent = true;
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

	$scope.predict = function (vteamstats,margin)
	{
		$scope.predictionMade = false;
		
		$scope.pointsAgainstTeam = parseInt(vteamstats[26]);
		
		GetGamesAgainstConference($scope);

		function GetGamesAgainstConference($scope){
			var found = false;
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
							$scope.pointsAgainstConference = 0;
						}
						else
						{
							$scope.pointsAgainstConference = data.resultSets[0].rowSet[0][26];
							Calculate($scope);
						}				
					})
				
				});
		}
		function Calculate($scope)
		{
			APIService.GetGlobalNBAStats($scope.playername_)
			.success(function (data) 
			{		
					if(data.payload.player.stats.playerSplit.splits.length > 0)  
					{
						var seasonAvg = data.payload.leagueSeasonAverage['pointsPg']; // we will sub this in if any stats come back empty
						var last5Games = data.payload.player.stats.playerSplit.splits[14].statAverage['pointsPg'];
						var inCurrentMonth = data.payload.player.stats.playerSplit.splits[15].statAverage['pointsPg'];
						var inPreviousMonth = data.payload.player.stats.playerSplit.splits[8].statAverage['pointsPg'];
						var onTheRoadAvg = data.payload.player.stats.playerSplit.splits[16].statAverage['pointsPg'];
						var atHome = data.payload.player.stats.playerSplit.splits[12].statAverage['pointsPg'];
						var homeorroad = 0;
						
						if($scope.Location == "Home")
						{
							homeorroad = atHome;
						}
						else
						{
							homeorroad = onTheRoadAvg;
						}
						
						var pointsAverage = ($scope.pointsAgainstTeam + $scope.pointsAgainstConference + last5Games + homeorroad) / 4;
						
						$scope.PredictedScore =  Math.round(pointsAverage);
						
						if($scope.PredictedScore >= parseInt(margin)){
							$scope.PlusMinus = Math.round((parseInt(margin) / Math.round(pointsAverage)) * 100);
						}
						else {
							$scope.PlusMinus = Math.round((Math.round(pointsAverage) / parseInt(margin)) * 100);
						}
					
						$scope.predictionMade = true;
					}
					else
					{
						$scope.notenoughgames = false;
						$scope.nodata = true;
						$scope.error = "Player has no data to predict with";
					}
					
			}).error(function (e) {
				$scope.notenoughgames = false;
				$scope.nodata = true;
				$scope.error = "Something went wrong: Player probable has limited data to work with" + e;
			});		

		}	
	}
});
