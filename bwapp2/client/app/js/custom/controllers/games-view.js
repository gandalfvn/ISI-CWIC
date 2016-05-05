/**========================================================
 * Module: games-view.js
 * Created by wjwong on 8/12/15.
 =========================================================*/
angular.module('angle').controller('gamesCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', '$meteorCollection', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, $meteorCollection){
  "use strict";
  
  $scope.dtOptions = {
    "lengthMenu": [[10], [10]],
    "order": [[1, "asc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  $scope.blockreplays = $meteorCollection(BlockReplays).subscribe('blockreplays');
  $scope.jobs = $meteorCollection(Jobs).subscribe('agentjobs');
  Meteor.subscribe("blockreplays", {
    onReady: function () {dataReady('blockreplays');},
    onError: function () { console.log("onError", arguments); }
  });
  Meteor.subscribe("agentjobs", {
    onReady: function () {dataReady('agentjobs');},
    onError: function () { console.log("onError", arguments); }
  });

  $scope.dataready = false;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 1){
      $scope.$apply(function(){
        $rootScope.dataloaded = true;
        $scope.dataready = true;
      })
    }
  }

  
  $scope.remove = function(id){
    $scope.blockreplays.remove(id);
    toaster.pop('error', 'Task Deleted');
  }
  
  $scope.TaskName = function(id){
    var res = _.find($scope.blockreplays, function(a){
      return id === a._id
    });
    if(res) return res.name;
    return id;
  }

  $scope.gotoGame = function(jobid, gameid){
    //$window.open('goal/'+gameid);
    $state.go('app.game', {jobid: jobid});
  }
}]);
