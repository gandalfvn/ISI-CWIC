/**========================================================
 * Module: gen-jobs-view.js
 * Created by wjwong on 9/23/15.
 =========================================================*/
angular.module('angle').controller('genJobsCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster){
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
  var genjobs = $scope.$meteorCollection(GenJobs);
  $scope.$meteorSubscribe("genjobs").then(
    function(sid){dataReady('genjobs');},
    function(err){ console.log("error", arguments, err); }
  );
  var genjobsmgr = $scope.$meteorCollection(GenJobsMgr);
  $scope.$meteorSubscribe("genjobsmgr").then(
    function(sid){dataReady('genjobsmgr');},
    function(err){ console.log("error", arguments, err); }
  );
  
  $scope.dataready = false;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 2){
      $rootScope.dataloaded = true;
      $scope.statenum = _.uniq(GenStates.find({}, {
        sort: {stateid: 1}, fields: {stateid: true}
      }).fetch().map(function(x) {
        return x.stateid;
      }), true);
      console.warn($scope.statenum);
    }
  };
  
  $scope.taskGen = function(tasktype, cstate, bundle, asncnt, antcnt){
    console.warn(tasktype, cstate, bundle, asncnt, antcnt);
    var statel = _.uniq(GenStates.find({stateid: cstate}, {
      sort: {"_id": 1}}).fetch().map(function(x) {
      return x._id;
    }), true);
    console.warn(statel);
  };


  $scope.remove = function(id){
    $scope.blockreplays.remove(id);
    toaster.pop('error', 'Game Deleted');
  };

  $scope.removeJob = function(id){
    $scope.jobs.remove(id);
    toaster.pop('error', 'Job Deleted');
  };

  $scope.TaskName = function(id){
    var res = $scope.findById($scope.blockreplays, id);
    if(res) return res.name;
    return 'N/A';
  };

  $scope.findById = function(collection, id){
    return _.find(collection, function(a){return id === a._id});
  };

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
  };

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
  };

}]);
