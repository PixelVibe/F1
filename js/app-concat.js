'use strict';
// Declare app level module which depends on filters, and services
angular.module('F1Feed', [
  'ngRoute',
  'F1Feed.controllers',
  'F1Feed.services',
  'ngSanitize'
]);
// Routes Configuration
angular.module('F1Feed').config([
  '$routeProvider',
  function ($routeProvider) {
    /*
    route patterns for Standings
    Structure = /year/round/standingsfor
              = /2008/5/driverStanding
              = /2009/constructorStandings
              = /current/6/driverStandings
  */
    $routeProvider.when('/standings/:year/:standingsFor', {
      controller: 'StandingsCtrl',
      templateUrl: function (params) {
        return 'partials/' + params.standingsFor + 'Standings.tpl.html';
      }
    });
    $routeProvider.when('/standings/:year/:round/:standingsFor', {
      controller: 'StandingsCtrl',
      templateUrl: function (params) {
        return 'partials/' + params.standingsFor + 'Standings.tpl.html';
      }
    });
    /*
    Route patterns for Constructors
    Structure = /year/constructors
              = /year/constructor/constructor_id
              = /year/constructor/constructor_id/circuits
              = /year/constructor/constructor_id/drivers
              = /year/constructor/constructor_id/grid
              = /year/constructor/constructor_id/results
              = /year/constructor/constructor_id/fastest
              = /year/constructor/constructor_id/status
  */
    $routeProvider.when('/:year/constructors', {
      controller: 'ConstructorsCtrl',
      templateUrl: 'partials/constructorsList.tpl.html'
    });
    $routeProvider.when('/:year/constructor/:constructor_id', {
      controller: 'ConstructorsCtrl',
      templateUrl: 'partials/constructorDetails.tpl.html'
    });
    $routeProvider.when('/:year/constructor/:constructor_id/:filter', {
      controller: 'ConstructorsCtrl',
      templateUrl: 'partials/constructorDetails.tpl.html'
    });
    /*
    Route patterns for drivers
    Structure = /year/drivers
              = /year/driver/driverID
              = /year/driver/driverID/status
  */
    $routeProvider.when('/info/:year/drivers', {
      controller: 'DriversCtrl',
      templateUrl: 'partials/drivers.tpl.html'
    });
    $routeProvider.when('/info/:year/driver/:driverID', {
      controller: 'DriversCtrl',
      templateUrl: 'partials/driverDetails.tpl.html'
    });
    /*
    Route patterns for circuits
    Structure = /year/constructors
  */
    $routeProvider.when('/info/:year/circuits', {
      controller: 'CircuitsCtrl',
      templateUrl: 'partials/circuits.tpl.html'
    });
    // Home - Dashboard
    $routeProvider.when('/', {
      controller: 'DashboardCtrl',
      templateUrl: 'partials/dashboard.tpl.html'
    });
    $routeProvider.otherwise({ redirectTo: '/' });
  }
]);
'use strict';
/*

  # - CONTROLLER       - DESCRIPTION
    - MainCtrl         - Controller attached to body to give access
                         to utilities. e.g. return current year.

    - StandingsCtrl    - Standings list for drivers and constructors.
                         Params for db query are year, round and a string
                         to determine which list to show (driver/constructor).

    - ConstructorsCtrl - Gets all constructors for the current year
                         Params for db query are year, constructors_id, and filter.
                         Filters : /circuits
                                   /drivers
                                   /grid
                                   /results
                                   /fastest
                                   /status
    - DriversCtrl
    - CircuitsCtrl
    - RaceScheduleCtrl
    - DashboardCtrl

*/
var StandingsList = [], ConstructorsList = [], DriversList = [], CircuitsList = [], nextEvent = [], prevEventResults = [], DriverStatus = [];
/* Controllers */
angular.module('F1Feed.controllers', []).controller('MainCtrl', [
  '$scope',
  function ($scope) {
    function getYear() {
      var currentDate = new Date();
      return currentDate.getFullYear();
    }
    $scope.currentYear = getYear();
  }
]).controller('StandingsCtrl', [
  '$scope',
  'ergastAPIservice',
  '$routeParams',
  function ($scope, ergastAPIservice, $routeParams) {
    $scope.$routeParams = $routeParams;
    var year = $routeParams.year, round = $routeParams.round, standingsFor = $routeParams.standingsFor;
    //if (typeof(StandingsList) === 'undefined')
    if (StandingsList.length === 0) {
      ergastAPIservice.getStandings(year, round, standingsFor).success(function (response) {
        if (standingsFor === 'driver')
          $scope.StandingsList = StandingsList = response.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        else
          $scope.StandingsList = StandingsList = response.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
      });
    } else {
      $scope.StandingsList = StandingsList;
    }
  }
]).controller('ConstructorsCtrl', [
  '$scope',
  'ergastAPIservice',
  '$routeParams',
  function ($scope, ergastAPIservice, $routeParams) {
    $scope.ConstructorsList = [];
    $scope.season = '';
    $scope.constructor_id = '';
    $scope.$routeParams = $routeParams;
    var year = $routeParams.year, constructor_id = $routeParams.constructor_id, filter = $routeParams.filter;
    ergastAPIservice.getConstructors(year, constructor_id, filter).success(function (response) {
      if (!constructor_id)
        $scope.ConstructorsList = ConstructorsList = response.MRData.ConstructorTable.Constructors;
      if (constructor_id) {
        $scope.constructor_id = constructor_id;
        $scope.year = year;
        switch (filter) {
        case 'circuits':
          $scope.ConstructorsList = ConstructorsList = response.MRData.CircuitTable.Circuits;
          break;
        case 'drivers':
          $scope.ConstructorsList = response.MRData.DriverTable.Drivers;
          break;
        case 'grid':
          $scope.ConstructorsList = response.MRData.StatusTable.Status;
          break;
        case 'results':
          $scope.ConstructorsList = response.MRData.RaceTable.Races;
          break;
        case 'fastest':
          $scope.ConstructorsList = response.MRData.StatusTable.Status;
          break;
        case 'status':
        /* falls through */
        default:
          $scope.ConstructorsList = response.MRData.StatusTable.Status;
          break;
        }
      }
    });
  }
]).controller('DriversCtrl', [
  '$scope',
  'ergastAPIservice',
  'wikiApiService',
  '$routeParams',
  function ($scope, ergastAPIservice, wikiApiService, $routeParams) {
    $scope.$routeParams = $routeParams;
    var year = $routeParams.year, driverID = $routeParams.driverID, filter = $routeParams.filter;
    ergastAPIservice.getDrivers(year, driverID, filter).success(function (response) {
      if (!driverID) {
        $scope.DriversList = [];
        $scope.DriversList = response.MRData.DriverTable.Drivers;
      }
      if (driverID) {
        $scope.DriverStatus = [];
        $scope.DriverStatus = DriverStatus = response.MRData.StatusTable;
        ergastAPIservice.getDriverWikiLink(driverID).success(function (response) {
          $scope.DriverWikiLink = response.MRData.DriverTable.Drivers[0].url;
          wikiApiService.getDriverInfo($scope.DriverWikiLink).success(function (response) {
            $scope.DriverBio = [];
            var wikiResponse = response.query.pages;
            for (var property in wikiResponse) {
              if (wikiResponse.hasOwnProperty(property)) {
                $scope.DriverBio = response.query.pages[property].revisions[0]['*'];
              }
            }
          }).error(function (status) {
            $scope.DriverBio = status;
          });
        });
      }
    });
  }
]).controller('CircuitsCtrl', [
  '$scope',
  'ergastAPIservice',
  '$routeParams',
  function ($scope, ergastAPIservice, $routeParams) {
    $scope.CircuitsList = [];
    $scope.$routeParams = $routeParams;
    var year = $routeParams.year, round = $routeParams.round, standingsFor = $routeParams.standingsFor;
    ergastAPIservice.getCircuits(year).success(function (response) {
      $scope.CircuitsList = response.MRData.CircuitTable.Circuits;
    });
  }
]).controller('RaceScheduleCtrl', [
  '$scope',
  'ergastAPIservice',
  '$routeParams',
  function ($scope, ergastAPIservice, $routeParams) {
    $scope.StandingsList = [];
    $scope.$routeParams = $routeParams;
    var year = $routeParams.year, round = $routeParams.round, standingsFor = $routeParams.standingsFor;
    ergastAPIservice.getStandings(year, round, standingsFor).success(function (response) {
      if (standingsFor === 'driver')
        $scope.StandingsList = response.MRData.StandingsTable.StandingsLists[0].DriverStandings;
      else
        $scope.StandingsList = response.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
    });
  }
]).controller('DashboardCtrl', [
  '$scope',
  'ergastAPIservice',
  '$routeParams',
  function ($scope, ergastAPIservice, $routeParams) {
    $scope.nextEvent = [];
    $scope.prevEventResults = [];
    $scope.prevEventConstructorResults = [];
    // Next event from now
    ergastAPIservice.getNextEvent().success(function (response) {
      $scope.nextEvent = nextEvent = response.MRData.RaceTable.Races[0];
      $scope.local_time_next = UTCtoLocalTime.toString();
    });
    // Returns top 3 drivers, with time, starting grid, name and constructor
    // http://ergast.com/api/f1/current/last/results?limit=3
    ergastAPIservice.getPrevEventResults().success(function (response) {
      $scope.prevEventResults = prevEventResults = response.MRData.RaceTable.Races[0];
      $scope.local_time_prev = UTCtoLocalTime.toString();
    });
    // return top 3 constructors.
    // http://ergast.com/api/f1/current/last/constructorStandings
    // ergastAPIservice.getPrevEventResults().success(function (response)
    // {
    //   prevEventConstructorResults = response.MRData.RaceTable.Races[0];
    // });
    // Time conversion applying UTC offset to start time (Time is in zulu which is the same with UTC)
    function UTCtoLocalTime(timestring) {
      var d = new Date();
      var locale_utc_offset = d.getTimezoneOffset() * 60 * -1;
      var hms_zulu = timestring.time;
      var hms = hms_zulu.slice(0, -1);
      var hms_clean = hms.split(':');
      var utc_seconds = +hms_clean[0] * 60 * 60 + +hms_clean[1] * 60 + +hms_clean[2];
      var total_seconds = utc_seconds + locale_utc_offset;
      var sec_num = parseInt(total_seconds, 10);
      var hours = Math.floor(sec_num / 3600);
      var minutes = Math.floor((sec_num - hours * 3600) / 60);
      var seconds = sec_num - hours * 3600 - minutes * 60;
      if (hours < 10) {
        hours = '0' + hours;
      }
      if (minutes < 10) {
        minutes = '0' + minutes;
      }
      if (seconds < 10) {
        seconds = '0' + seconds;
      }
      var time = hours + ':' + minutes + ':' + seconds;
      return time;
    }  // Reverse date order
       // function parseDate(input)
       // {
       //   var date_parts = nextEvent..split('-');
       //   return new Date(parts[0], parts[1]-1, parts[2]); // Note: months are 0-based
       // }
  }
]);
'use strict';  /* Directives */
'use strict';  /* Filters */
'use strict';
/* Services */
angular.module('F1Feed.services', []).factory('ergastAPIservice', [
  '$http',
  function ($http) {
    var ergastAPI = {};
    var theUrl;
    ergastAPI.getStandings = function (year, round, standingsFor) {
      if (!round)
        theUrl = 'http://ergast.com/api/f1/' + year + '/' + standingsFor + 'Standings.json?callback=JSON_CALLBACK';
      else
        theUrl = 'http://ergast.com/api/f1/' + year + '/' + round + '/' + standingsFor + 'Standings.json?callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    ergastAPI.getConstructors = function (year, constructor_id, filter) {
      if (!constructor_id)
        theUrl = 'http://ergast.com/api/f1/' + year + '/constructors.json?callback=JSON_CALLBACK';
      else if (!filter)
        theUrl = 'http://ergast.com/api/f1/' + year + '/constructors/' + constructor_id + '/status.json?callback=JSON_CALLBACK';
      else
        theUrl = 'http://ergast.com/api/f1/' + year + '/constructors/' + constructor_id + '/' + filter + '.json?callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    ergastAPI.getDrivers = function (year, driverID, filter) {
      if (!driverID)
        theUrl = 'http://ergast.com/api/f1/' + year + '/drivers.json?callback=JSON_CALLBACK';
      else if (!filter)
        theUrl = 'http://ergast.com/api/f1/' + year + '/drivers/' + driverID + '/status.json?callback=JSON_CALLBACK';
      else
        theUrl = 'http://ergast.com/api/f1/' + year + '/drivers/' + driverID + '/' + filter + '.json?callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    ergastAPI.getDriverWikiLink = function (driverID) {
      theUrl = 'http://ergast.com/api/f1/drivers/' + driverID + '.json?callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    ergastAPI.getCircuits = function (year) {
      theUrl = 'http://ergast.com/api/f1/' + year + '/circuits.json?callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    ergastAPI.getNextEvent = function () {
      theUrl = 'http://ergast.com/api/f1/current/next.json?callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    ergastAPI.getPrevEventResults = function () {
      theUrl = 'http://ergast.com/api/f1/current/last/results.json?limit=3&callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    return ergastAPI;
  }
]).factory('wikiApiService', [
  '$http',
  function ($http) {
    var wikiAPI = {};
    wikiAPI.getDriverInfo = function (link) {
      var wikiLink = link.split('wiki/');
      var wikiTitleClean = wikiLink[1];
      var theUrl = 'http://en.wikipedia.org/w/api.php?action=query&prop=revisions&format=json&rvprop=content&rvlimit=1&rvparse=&rvsection=0&rvcontentformat=text%2Fplain&titles=' + wikiTitleClean + '&callback=JSON_CALLBACK';
      return $http({
        method: 'JSONP',
        url: theUrl
      });
    };
    return wikiAPI;
  }
]);