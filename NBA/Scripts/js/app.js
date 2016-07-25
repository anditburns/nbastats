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
	
	
	APIService.GetAllPlayersOnTeam = function(teamname){
		return $http.jsonp(urlBase + '/commonallplayers', {
            params: {LeagueID:'00', Season:'2015-16', IsOnlyCurrentSeason:1, callback:'JSON_CALLBACK'}
        }).then(function (response) 
			   {
				var team = {
					playerdetails: []
				};  
				var found = false;
				var headers = new Array();	   
				if (response.data == null || response.data.length == 0) {				
						$scope.noresultsfound = true;
						//$scope.searchResults = null;
				} else {				
					headers = response.data.resultSets[0].headers;								
					var rowSet = response.data.resultSets[0].rowSet;
					angular.forEach(rowSet, function (player, outerkey) 
					{
						  angular.forEach(player, function (dets, innerkey) 
						  {
							if(!found){
								if(teamname == player[11])
								{
									found = true;
									team.playerdetails.push({
										"name_": player[6],
										"displayName": player[2],
										"playerid": player[0],
										"predScore": 0
										
									});
								}
							}
						  });
						  found = false;
				   });
					
				}
				return {header: headers, teamlist: team};
			},function (httpError) {
				 // translate the error
				 throw httpError.status + " : " + 
					   httpError.data;
			  });
		};
		
	
	APIService.GetGamesVsTeam = function (playerId, teamId) {
        return $http.jsonp(urlBase + '/playerdashboardbylastngames', {
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:playerId,Outcome:'',Location:'',Month:0,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:teamId, VsConference:'',VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:'0', callback:'JSON_CALLBACK'}
		}).then(
		    function(response) {
				var ptsAverage = 0;
				var numGames = 0;
				var arr_headers = new Array();
				var arr_body = new Array();
				if (response.data == null || response.data.resultSets[0].rowSet.length == 0) 
				{				
					numGames = 0;
				}
				else 
				{
				    numGames = response.data.resultSets[0].rowSet[0][2];
					arr_headers = response.data.resultSets[1].headers;
					arr_body = response.data.resultSets[0].rowSet;
				}
				return{headers: arr_headers, body: arr_body, gamesPlayed: numGames};   
			},function (httpError) {
				 // translate the error
				 throw httpError.status + " : " + 
					   httpError.data;
			  }); 
    };
	
	APIService.GetGamesVsConference = function (playerId, op_conference) {
        return $http.jsonp(urlBase + '/playerdashboardbylastngames', {
            params: {MeasureType:'Base',PerMode:'PerGame',PlusMinus:'N',PaceAdjust:'N',Rank:'N',LeagueID:'00',Season:'2015-16',SeasonType:'Regular Season',PORound:0,PlayerID:playerId,Outcome:'',Location:'',Month:0,SeasonSegment:'',DateFrom:'',DateTo:'',OpponentTeamID:0,VsConference:op_conference,VsDivision:'',GameSegment:'',Period:0,ShotClockRange:'',LastNGames:0, callback:'JSON_CALLBACK'}
		}).then(
		    function(response) {
				var ptsAverage = 0;
				var numGames = 0;
	
				if (response.data == null || response.data.resultSets[0].rowSet.length == 0) 
				{				
					numGames = 0; 
				}
				else 
				{
				    ptsAverage = response.data.resultSets[0].rowSet[0][26];
				}
				return{ptsAvg: ptsAverage, gamesPlayed: numGames};   
			},function (httpError) {
				 // translate the error
				 throw httpError.status + " : " + 
					   httpError.data;
			  });
    };
	
	APIService.GetTeamDetails = function(teamname){
		return $http.get('Data/teams.json').then(
			function(response) {
				var conference = '';
				var teamId = '';
				var found = false;
					 angular.forEach(response.data, function (team, key) {
					   if(!found){
						   if(team["simpleName"] == teamname){
						       teamId = team["teamId"];
							   conference = team["conf"];
							   found = true;
						   }
					   }	
				   });
				return {teamId: teamId, conf: conference};
			},
              function (httpError) {
                 // translate the error
                 throw httpError.status + " : " + 
                       httpError.data;
              });
	};
	
	APIService.GetGlobalNBAStats = function (playername){
			return  $http.get('http://au.global.nba.com/stats2/player/stats.json?ds=splits&locale=au&playerCode='+playername)
			.then(function(response)
			{
			    var seasonAvg = 0;
				var last5Games = 0;
				var inCurrentMonth = 0;
				var inPreviousMonth = 0;
				var onTheRoadAvg = 0;
				var atHome = 0;
				
				if(response.data.payload.player.stats.playerSplit.splits.length > 0)  
				{
					seasonAvg = response.data.payload.leagueSeasonAverage['pointsPg']; // we will sub this in if any stats come back empty
					last5Games = response.data.payload.player.stats.playerSplit.splits[14].statAverage['pointsPg'];
					inCurrentMonth = response.data.payload.player.stats.playerSplit.splits[15].statAverage['pointsPg'];
					inPreviousMonth = response.data.payload.player.stats.playerSplit.splits[8].statAverage['pointsPg'];
					onTheRoadAvg = response.data.payload.player.stats.playerSplit.splits[16].statAverage['pointsPg'];
					atHome = response.data.payload.player.stats.playerSplit.splits[12].statAverage['pointsPg'];
				}
				return{ seasonAvg: seasonAvg, last5Games: last5Games, inCurrentMonth: inCurrentMonth, inPreviousMonth: inPreviousMonth, onTheRoadAvg: onTheRoadAvg, atHome: atHome}
			},
              function (httpError) {
                 // translate the error
                 throw httpError.status + " : " + 
                       httpError.data;
              });	
				
	};

	
	
	APIService.GetTeamSchedule = function(teamname){
		return  $http.get('http://au.global.nba.com/stats2/team/schedule.json?countryCode=AU&locale=au&teamCode='+teamname)
			.then(function(response)
			{
				return{response}
			}, function (httpError) {
				lu
				
                 // translate the error
                 throw httpError.status + " : " + 
                       httpError.data;
              });	
		
	};
	
	
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
            templateUrl: './playerModal.html',
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


	$scope.expandedStatsTeam = function (items) {

        var modelInstance = $uibModal.open({
            templateUrl: './teamModal.html',
            controller: 'TeamModalInstanceCtrl',
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
	//$scope.PlayerId = items[0];
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
			$scope.PlayerId = data.resultSets[1].rowSet[0][0];
		});			
	}
	
	$scope.search = function () {
		var found = false;
		APIService.GetTeamDetails($scope.Opposition)
		.then(function (data)
		{
		   $scope.op_TeamId = data.teamId;
		}).then(function ()
		{
			APIService.GetGamesVsTeam($scope.PlayerId, $scope.op_TeamId)
				.then(function (data) 
				{		
					if($scope.Location == "Home"){
						$scope.l = "@";
					}
					if($scope.Location == "Road"){
						$scope.l = "on the";
					}

					$scope.headers = data.headers;
					$scope.playerInfoBody = data.body;
					$scope.gamesPlayedT = data.gamesPlayed;
					$scope.finished = true;
				});
		});
	}

	$scope.predict = function (vteamstats,margin,playerId,opposition,loc)
	{
		$scope.predictionMade = false;
		$scope.Location = loc;
		
		$scope.pointsAgainstTeam = parseInt(vteamstats[26]);

		APIService.GetTeamDetails(opposition)
		.then(function (data)
		{
		   $scope.op_conference = data.conf;
		}).then(function ()
		{ 
			APIService.GetGamesVsConference(playerId, $scope.op_conference)
			 .then(function (data) 
			{		
				$scope.pointsAgainstConference = data.ptsAvg;
				$scope.gamesPlayedC = data.gamesPlayed;			
			}).then(function ()
			{
				var pointsAverage = 0;
				  APIService.GetGlobalNBAStats($scope.playername_)
				  .then(function (data)
				  {
					  var homeorroad = 0;
					  if($scope.Location == "Home")
						{
							homeorroad = data.atHome;
						}
						else
						{
							homeorroad = data.onTheRoadAvg;
						}
						
						if($scope.Location == "Home")
						{
							homeorroad = data.atHome;
						}
						else
						{
							homeorroad = data.onTheRoadAvg;
						}
						
						pointsAverage = ($scope.pointsAgainstTeam + $scope.pointsAgainstConference + data.last5Games + homeorroad) / 4;
						
						$scope.PredictedScore =  Math.round(pointsAverage);
						
						if($scope.PredictedScore >= parseInt(margin)){
							$scope.PlusMinus = Math.round((parseInt(margin) / Math.round(pointsAverage)) * 100);
						}
						else {
							$scope.PlusMinus = Math.round((Math.round(pointsAverage) / parseInt(margin)) * 100);
						}
					
						$scope.predictionMade = true;
				  });
		});

	});	
  }
});

app.controller('TeamModalInstanceCtrl', function ($scope, $uibModalInstance, $sce, items, APIService) {
	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	
		$scope.valid = true;
	
		var teamname = items[11];
		$scope.teamname = items[11];
		 APIService.GetAllPlayersOnTeam(teamname)
			.then(function (data) {		
				$scope.team = data.teamlist;	
		}).then(function (data){
			 APIService.GetTeamSchedule(teamname)
			   .then(function (data){
			   });
		});
		
		
		
		
		
		
		
		
		$scope.predict = function (player, opposition, loc, index)
		{
			$scope.predictionMade = false;
			$scope.Location = loc;
			$scope.playerIndex = index;
			
			$scope.oppostion = opposition;
			$scope.playerId = player.playerid;
			$scope.playerName = player.name_;
	
			APIService.GetTeamDetails(opposition)
				.then(function (data)
				{
					$scope.op_conference = data.conf;
					$scope.op_TeamId = data.teamId;
				}).then(function ()
				{
					APIService.GetGamesVsTeam($scope.playerId, $scope.op_TeamId)
					.then(function (data) 
					{		
						$scope.pointsAgainstTeam = data.body[0][26];
						$scope.gamesPlayedT = data.gamesPlayed;
					}).then (function () 
				{ 
					APIService.GetGamesVsConference($scope.playerId, $scope.op_conference)
					 .then(function (data) 
					{		
						$scope.pointsAgainstConference = data.ptsAvg;
						$scope.gamesPlayedC = data.gamesPlayed;			
					}).then(function ()
					{
						var pointsAverage = 0;
						  APIService.GetGlobalNBAStats($scope.playerName)
						  .then(function (data)
						  {
							  var homeorroad = 0;
							  if($scope.Location == "Home")
								{
									homeorroad = data.atHome;
								}
								else
								{
									homeorroad = data.onTheRoadAvg;
								}
								
								if($scope.Location == "Home")
								{
									homeorroad = data.atHome;
								}
								else
								{
									homeorroad = data.onTheRoadAvg;
								}
								
								$scope.team.playerdetails[$scope.playerIndex].predScore = Math.round(($scope.pointsAgainstTeam + $scope.pointsAgainstConference + data.last5Games + homeorroad) / 4);
								
									
								});
						  });
						  
					});

				});	
		}
});
		