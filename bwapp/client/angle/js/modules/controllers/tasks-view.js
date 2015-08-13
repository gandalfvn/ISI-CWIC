/**========================================================
 * Module: tasks-view.js
 * Created by wjwong on 8/11/15.
 =========================================================*/

/**========================================================
 * Module: world-view.js
 * Created by wjwong on 7/27/15.
 =========================================================*/
angular.module('angle').controller('tasksCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', '$meteorCollection', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, $meteorCollection){
  "use strict";

  //check for agent role
  if($rootScope.isRole($rootScope.currentUser, 'agent')){
    return $state.go('app.root');
  }

  $scope.dtOptions = {
    "lengthMenu": [[10], [10]],
    "order": [[ 1, "asc" ]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  $scope.blockreplays = $meteorCollection(BlockReplays).subscribe('blockreplays');
  console.warn($scope.blockreplays);

  $scope.agents = $meteorCollection(Meteor.users, false).subscribe('agents');
  console.warn('agents', $scope.agents);
  
  $scope.jobs = $meteorCollection(Jobs).subscribe('jobs');
  console.warn('jobs', $scope.jobs);

  $scope.remove = function(id){
    $scope.blockreplays.remove(id);
    toaster.pop('error', 'Game Deleted');
  }

  $scope.removeJob = function(id){
    $scope.jobs.remove(id);
    toaster.pop('error', 'Job Deleted');
  }

  $scope.selectAgent = function(repid){
    var repdata = {agents: $scope.agents};
    var dcon = {
      disableAnimation: true,
      template: 'didAgents',
      data: repdata,
      controller: ['$scope', function($scope){
        $scope.dtOptions = {
          "lengthMenu": [[8], [8]],
          "order": [[ 0, "asc" ]],
          "language": {"paginate": {"next": '>', "previous": '<'}},
          "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
        };
      }],
      className: 'ngdialog-theme-default width50perc'
    };
    var dialog = ngDialog.open(dcon);
    dialog.closePromise.then(function (data) {
      if(data && data.value){
        console.warn('choose', repid, data.value);
        assignJob(repid, data.value);
      }
    });
  }

  $scope.AgentName = function(id){
    var res = _.find($scope.agents, function(a){return id === a._id});
    if(res) return res.username;
    return 'N/A';
  }

  $scope.TaskName = function(id){
    var res = _.find($scope.blockreplays, function(a){return id === a._id});
    if(res) return res.name;
    return 'N/A';
  }

  var assignJob = function(taskid, agentid){
    var job = {
      owner: $rootScope.currentUser._id,
      created: new Date().getTime(),
      creator: $rootScope.currentUser.username,
      agent: agentid,
      assigned: new Date().getTime(),
      task: taskid
    };
    $scope.jobs.save(job).then(
      function(val){
        toaster.pop('info', 'Job Created');
      }, function(err){
        toaster.pop('error', 'Job Error', err.reason);
      }
    );
  }
}]);