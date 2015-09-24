/**========================================================
 * Module: gen-tasks-view.js
 * Created by wjwong on 9/23/15.
 =========================================================*/
angular.module('angle').controller('genTasksCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster){
  "use strict";

  $scope.dtOptions = {
    "lengthMenu": [[10], [10]],
    "order": [[ 1, "asc" ]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  var genstates = $scope.$meteorCollection(GenStates);
  $scope.$meteorSubscribe("genstates").then(
    function(sid){dataReady('genstates');},
    function(err){ console.log("error", arguments, err); }
  );
  $scope.stateslist = $scope.$meteorCollection(StatesList);
  $scope.$meteorSubscribe("stateslist").then(
    function(sid){dataReady('stateslist');},
    function(err){ console.log("error", arguments, err); }
  );
  var agents = $scope.$meteorCollection(Meteor.users, false);
  $scope.$meteorSubscribe("agents").then(
    function(sid){dataReady('agents');},
    function(err){ console.log("error", arguments, err); }
  );

  /*$scope.jobs = $meteorCollection(Jobs).subscribe('jobs');
  $scope.annotations = $meteorCollection(Annotations).subscribe('annotations');
  Meteor.subscribe("blockreplays", {
    onReady: function () {dataReady('blockreplays');},
    onError: function () { console.log("onError", arguments); }
  });
  Meteor.subscribe("jobs", {
    onReady: function () {dataReady('jobs');},
    onError: function () { console.log("onError", arguments); }
  });
  Meteor.subscribe("annotations", {
    onReady: function () {dataReady('annotations');},
    onError: function () { console.log("onError", arguments); }
  });*/

  $scope.dataready = false;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 2){
      $rootScope.dataloaded = true;
    }
  }


  $scope.remove = function(id){
    $scope.blockreplays.remove(id);
    toaster.pop('error', 'Game Deleted');
  }

  $scope.removeJob = function(id){
    $scope.jobs.remove(id);
    toaster.pop('error', 'Job Deleted');
  }

  $scope.selectAgent = function(uid, type){
    var repdata = {agents: agents};
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
      if(data && data.value !== '$closeButton'){
        console.warn('choose', uid, data.value, type);
        switch(type){
          case 'job':
            assignJob(uid, data.value);
            break;
          case 'desc':
          case 'act':
            assignAnnot(uid, data.value, type);
            break;
        }
      }
    });
  }

  $scope.AgentName = function(id){
    var res = $scope.findById(agents, id);
    if(res) return res.username;
    return 'N/A';
  }

  $scope.TaskName = function(id){
    var res = $scope.findById($scope.blockreplays, id);
    if(res) return res.name;
    return 'N/A';
  }

  $scope.findById = function(collection, id){
    return _.find(collection, function(a){return id === a._id});
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

  var assignAnnot = function(jobid, agentid, type){
    var annot = {
      owner: $rootScope.currentUser._id,
      created: new Date().getTime(),
      creator: $rootScope.currentUser.username,
      agent: agentid,
      assigned: new Date().getTime(),
      job: jobid,
      type: type
    };
    $scope.annotations.save(annot).then(
      function(val){
        var myjob = $scope.findById($scope.jobs, jobid);
        var key = 'kfannot_'+type;
        if(!myjob[key]) myjob[key] = [];
        myjob[key].push(val[0]._id);
        myjob[key] = _.uniq(myjob[key]);
        console.warn('created', val[0], myjob);
        toaster.pop('info', 'Annotation type: '+type+' created.');
      }, function(err){
        toaster.pop('error', 'Annotation Error', err.reason);
      }
    );
  }

}]);
