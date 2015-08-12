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
  
  $scope.blockreplays = $meteorCollection(BlockReplays).subscribe('blockreplays');
  console.warn($scope.blockreplays);

  $scope.agents = $meteorCollection(Meteor.users, false).subscribe('agents');
  console.warn('agents', $scope.agents);
  
  $scope.jobs = $meteorCollection(Jobs).subscribe('jobs');
  console.warn('jobs', $scope.jobs);

  $scope.remove = function(id){
    $scope.blockreplays.remove(id);
    toaster.pop('error', 'Task Deleted');
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

  var assignJob = function(taskid, agentid){
    var job = {
      owner: $rootScope.currentUser._id,
      created: new Date().getTime(),
      creator: $rootScope.currentUser.username,
      agent: agentid,
      task: taskid
    };
    $scope.jobs.push(job);
  }
}]);