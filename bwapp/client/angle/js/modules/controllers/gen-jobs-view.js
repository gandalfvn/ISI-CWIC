/**========================================================
 * Module: gen-jobs-view.js
 * Created by wjwong on 9/23/15.
 =========================================================*/
angular.module('angle').controller('genJobsCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', 'md5', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, md5){
  "use strict";

  $scope.dtOptions = {
    "lengthMenu": [[10], [10]],
    "order": [[ 0, "asc" ]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  var genstates = $scope.$meteorCollection(GenStates);
  $scope.$meteorSubscribe("genstates").then(
    function(sid){dataReady('genstates');},
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
    if(readydat.length > 1){
      $rootScope.dataloaded = true;
      $scope.statenum = $rootScope.mdbArray(GenStates, {}, {
        sort: {stateid: 1}, fields: {stateid: true}
      }, "stateid");
      console.warn($scope.statenum);
      updateJobMgr();
    }
  };
  
  $scope.taskGen = function(tasktype, stateid, bundle, asncnt, antcnt){
    console.warn(tasktype, stateid, bundle, asncnt, antcnt);
    var statelist = $rootScope.mdbArray(GenStates, {stateid: Number(stateid)}, {
      sort: {"_id": 1}}, "_id");
    console.warn(statelist);
    if(statelist.length){
      var jobdata = {
        tasktype: tasktype,
        stateid: stateid,
        bundle: bundle,
        asncnt: asncnt,
        antcnt: antcnt,
        creator: $rootScope.currentUser._id,
        created: (new Date).getTime(),
        public: true,
        islist: true
      };
      
      var availlist = [];
      //generate action jobs from states
      var doneAvailList = _.after(statelist.length, function(){
        var bundleidlist = [];
        var bundcnt = Math.ceil(availlist.length/jobdata.bundle);
        var doneBundles = _.after(bundcnt, function(){
          jobdata.list = bundleidlist;
          genjobsmgr.save(jobdata).then(function(val){
              var jmid = val[0]._id;
              updateJobMgr();
              toaster.pop('info', 'Jobs Created', val[0]._id);
            }
            , function(err){
              toaster.pop('error', 'State ' + $scope.dbid, err.reason);
            })
        });

        function saveBundle(){
          var mybundledata = {
            islist: false,
            tasktype: jobdata.tasktype,
            creator: $rootScope.currentUser._id,
            created: (new Date).getTime(),
            asncnt: jobdata.asncnt,
            antcnt: jobdata.antcnt,
            sidlist: abundle
          };
          genjobsmgr.save(mybundledata).then(function(val){
              bundleidlist.push(val[0]._id);
              doneBundles();
              toaster.pop('info', 'Bundle Created', val[0]._id);
            }
            , function(err){
              toaster.pop('error', 'Bundle Data', err.reason);
            }
          );
          abundle = [];
        }
        var abundle = [];
        for(var i = 0; i < availlist.length; i++){
          if(!(i % jobdata.bundle) && i) saveBundle();
          abundle.push(availlist[i]);
        }
        if(abundle.length) saveBundle(); //save the dangling bundles
      });

      for(var i = 0; i < statelist.length; i++){
        var sid = statelist[i];
        if(tasktype == 'action'){
          var state = GenStates.findOne({_id: sid});
          for(var j = 0; j < state.next.length; j++){
            var tid = state.next[j];
            availlist.push({src: sid, tgt: tid});
          }
        }
        else availlist.push(sid);
        doneAvailList();
      }
    }
  };
  
  var updateJobMgr = function(){
    $scope.jobmgrlist = GenJobsMgr.find({islist: true}, {sort: {"_id": 1}}).fetch();
    console.warn($scope.jobmgrlist);
  };
  
  $scope.selectJob = function(jid){
    $scope.jobinfo = GenJobsMgr.findOne({_id: jid});
    console.warn($scope.jobinfo);
  }
}]);
