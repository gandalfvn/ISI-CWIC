/**========================================================
 * Module: gen-task-view.js
 * Created by wjwong on 10/5/15.
 =========================================================*/

//?taskid=2kw6CqcqjRzsHBWD2&assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE&hitId=123RVWYBAZW00EXAMPLE&turkSubmitTo=https://www.mturk.com/&workerId=AZ3456EXAMPLE

angular.module('angle').controller('genTaskCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', 'Utils', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, utils){
  "use strict";

  console.warn($rootScope.currentUser);
  var genstates = $scope.$meteorCollection(GenStates);
  $scope.$meteorSubscribe("genstates").then(
    function(sid){dataReady('genstates');},
    function(err){ console.log("error", arguments, err); }
  );

  var screencaps = $scope.$meteorCollection(ScreenCaps);
  $scope.$meteorSubscribe("screencaps").then(
    function(sid){dataReady('screencaps');},
    function(err){ console.log("error", arguments, err); }
  );

  var genjobsmgr = $scope.$meteorCollection(GenJobsMgr);
  $scope.$meteorSubscribe("genjobsmgr").then(
    function(sid){dataReady('genjobsmgr');},
    function(err){ console.log("error", arguments, err); }
  );

  $scope.isOpenDir = true;
  $scope.taskdata;
  $scope.taskidx = 0;
  $scope.notes = null;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 2){
      var isAdminUser = ($rootScope.currentUser)? $rootScope.isRole($rootScope.currentUser, 'admin') : false;
      if($stateParams.report && !isAdminUser){
        $rootScope.dataloaded = true;
        return;
      }
      console.warn($stateParams);
      if($stateParams.taskId){
        $scope.taskdata = GenJobsMgr.findOne($stateParams.taskId);
        console.warn('taskdata', $scope.taskdata);
        $scope = _.extend($scope, $stateParams);
        //if($stateParams.workerId) $scope.workerId = $stateParams.workerId;
        //if($stateParams.assignmentId) $scope.assignmentId = $stateParams.assignmentId;
        if($scope.workerId === 'EXAMPLE') $scope.submitter = true;
        var isValid = true;
        if($scope.hitId){
          //load hit
          $scope.hitdata = GenJobsMgr.findOne('H_'+$scope.hitId);
          if($scope.hitdata && $scope.hitdata.submitted && isValid && $scope.workerId && $scope.workerId !== 'EXAMPLE'){
            if(!_.isUndefined($scope.hitdata.submitted[$scope.workerId])){
              //worker already submitted
              $scope.submitter = $scope.hitdata.submitted[$scope.workerId];
            }
          }
        }
        var sid = $scope.taskdata.stateid;
        $scope.$meteorSubscribe("genstates", sid).then(
          function(sub){
            $scope.curState = GenStates.findOne(sid);
            console.warn('curState',$scope.curState);
            $scope.taskidx = 0;
            if($stateParams.report){ //report view
              $scope.report = $stateParams.report;
              $timeout(function(){
                renderReport(0)
              });
            }
            else if(isValid) renderTask($scope.taskidx); //single item view
            Meteor.call('mturkReviewableHITs', {hid: $scope.hitId},  function(err, resp){
              console.warn(err,resp);
            })
          },
          function(err){
            console.warn('err', err);
            $scope.$apply(function(){toaster.pop('error', sid+' Not Found', err.reason)});
          }
        );
      }
    }
  };

  var renderReport = function(idx){
    if(_.isUndefined($scope.taskdata.idxlist[idx])){
      $rootScope.dataloaded = true;
      return;
    }
    if($scope.taskdata.tasktype == 'action'){
      var aidx = $scope.taskdata.idxlist[idx];
      var bidx = ($scope.taskdata.movedir == 'reverse')? aidx-1 : aidx+1;
      $('#statea'+idx).empty();
      $('#stateb'+idx).empty();
      var scids = [$scope.curState.block_states[aidx].screencapid, $scope.curState.block_states[bidx].screencapid];
      $scope.$meteorSubscribe('screencaps', scids).then(
        function(sub){
          var screena = ScreenCaps.findOne(scids[0]);
          var screenb = ScreenCaps.findOne(scids[1]);
          showImage(screena.data, 'Before', null, 'statea'+idx);
          showImage(screenb.data, 'After', null, 'stateb'+idx);
          renderReport(idx+1);
        }
      );
    }
  };
  
  var renderTask = function(idx){
    console.warn('renderTask', idx);
    //create the annotations
    if($scope.hitdata){
      if(!$scope.hitdata.notes) $scope.hitdata.notes = {};
      if(!$scope.hitdata.notes[$scope.workerId]) $scope.hitdata.notes[$scope.workerId] = {};
      if(!$scope.hitdata.notes[$scope.workerId][idx]){
        $scope.hitdata.notes[$scope.workerId][idx] = [];
        for(var i =0; i < $scope.taskdata.antcnt; i++)
          $scope.hitdata.notes[$scope.workerId][idx].push('');
      }
      $scope.notes = $scope.hitdata.notes[$scope.workerId][idx];
    }
    else{//only an example no HIT id
      $scope.notes = [];
      for(var i =0; i < $scope.taskdata.antcnt; i++)
        $scope.notes.push('');
    }
    if($scope.taskdata.tasktype == 'action'){
      var aidx = $scope.taskdata.idxlist[idx];
      var bidx = ($scope.taskdata.movedir == 'reverse')? aidx-1 : aidx+1;
      $('#statea').empty();
      $('#stateb').empty();
      var scids = [$scope.curState.block_states[aidx].screencapid, $scope.curState.block_states[bidx].screencapid];
      $scope.$meteorSubscribe('screencaps', scids).then(
        function(sub){
          var screena = ScreenCaps.findOne(scids[0]);
          var screenb = ScreenCaps.findOne(scids[1]);
          showImage(screena.data, 'Before', null, 'statea');
          showImage(screenb.data, 'After', null, 'stateb');
          $rootScope.dataloaded = true;
        }
      );
    }
  };
  
  var showImage = function(b64i, title, caption, attachID){
    if(!attachID) return console.warn('Missing dom attach id');
    var canvas = {width: 384, height: 264};
    var b64img = LZString.decompressFromUTF16(b64i);

    var eleDivID = 'div' + $('div').length; // Unique ID
    var eleImgID = 'img' + $('img').length; // Unique ID
    var eleLabelID = 'h4' + $('h4').length; // Unique ID
    var htmlout = '<img id="'+eleImgID+'" style="width:'+canvas.width+'px;height:'+canvas.height+'px"></img>';
    if(title) htmlout = '<h4>'+title+'</h4>' + htmlout;
    if(caption) htmlout += '<label id="'+eleLabelID+'" class="mb">'+caption+'</label>';
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-4')
      .html(htmlout).css({}).appendTo('#'+attachID);

    var img = document.getElementById(eleImgID); // Use the created element
    img.src = b64img;
  };
  
  $scope.itrAnnot = function(notes, vdir){
    var previdx = $scope.taskidx;
    $scope.taskidx+=vdir;
    if($scope.taskidx != 0) $scope.isOpenDir = false;
    else $scope.isOpenDir = true;
    $rootScope.dataloaded = false;
    if($scope.submitter){
      //read only submission already done
      if($scope.taskidx >= $scope.taskdata.idxlist.length) $scope.taskidx = 0;
      renderTask($scope.taskidx);
    }
    else{//new entry save as we go
      if($scope.hitId){
        if(!$scope.hitdata.timed) $scope.hitdata.timed = {};
        if(!$scope.hitdata.timed[$scope.workerId]) $scope.hitdata.timed[$scope.workerId] = {};
        if(!$scope.hitdata.timed[$scope.workerId][previdx]) $scope.hitdata.timed[$scope.workerId][previdx] = (new Date()).getTime();
        if($scope.taskidx >= $scope.taskdata.idxlist.length && $scope.assignmentId && $scope.assignmentId != 'ASSIGNMENT_ID_NOT_AVAILABLE'){
          //submission assignment as done
          if(!$scope.hitdata.submitted) $scope.hitdata.submitted = {};
          if(!$scope.hitdata.submitted[$scope.workerId]){
            $scope.hitdata.submitted[$scope.workerId] = {
              time: (new Date()).getTime(),
              aid: $scope.assignmentId,
              submitto: $scope.turkSubmitTo
            };
            $scope.submitter = $scope.hitdata.submitted[$scope.workerId];
            $scope.taskidx = 0;
            $.post($scope.turkSubmitTo, {assignmentId: $scope.assignmentId, time: (new Date()).getTime()}, function(resp){
              console.warn(resp);
              GenJobsMgr.update({_id: $scope.hitdata._id}, {
                $set: {
                  notes: $scope.hitdata.notes,
                  timed: $scope.hitdata.timed,
                  submitted: $scope.hitdata.submitted
                }
              }, function(err, ret){
                console.warn('hit', err, ret);
                toaster.pop('info', 'HIT Task Submitted');
              })
            });
          }
        }
        else{
          //must use update instead of save because _id is custom generated
          GenJobsMgr.update({_id: $scope.hitdata._id}, {
            $set: {
              notes: $scope.hitdata.notes,
              timed: $scope.hitdata.timed
            }
          }, function(err, ret){
            if(err) return toaster.pop('error', err.reason);
            renderTask($scope.taskidx);
          });
        }
      }
      else toaster.pop('error', 'Missing HIT Id');
    }
  };

  $scope.dlScene = function(){
    var tempframe = {_id: $scope.curState._id,
      public: $scope.curState.public, name: $scope.curState.name, created: $scope.curState.created,
      creator: $scope.curState.creator, block_meta: $scope.curState.block_meta, block_states: []};

    for(var idx = 0; idx < $scope.curState.block_states.length; idx++){
      var block_state = $scope.curState.block_states[idx].block_state;
      var newblock_state = [];
      for(var i = 0; i < block_state.length; i++){
        var s = block_state[i];
        var pos = '', rot = '';
        _.each(s.position, function(v){
          if(pos.length) pos += ',';
          pos += v;
        });
        _.each(s.rotation, function(v){
          if(rot.length) rot += ',';
          rot += v;
        });
        newblock_state.push({id: s.id, position: pos, rotation: rot})
      }
      tempframe.block_states.push({block_state: newblock_state});
    }
    var content = JSON.stringify(tempframe, null, 2);
    var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
    saveAs(uriContent, 'bw_scene_'+$scope.curState._id+'.json');
  };

  $scope.dlNotes = function(){
    var content = JSON.stringify($scope.taskdata, null, 2);
    var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
    saveAs(uriContent, 'bw_notes_'+$scope.taskdata._id+'_'+$scope.workerId+'.json');
  };

  function saveAs(uri, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
      link.href = uri;
      link.download = filename;
      //Firefox requires the link to be in the body
      document.body.appendChild(link);
      //simulate click
      link.click();
      //remove the link when done
      document.body.removeChild(link);
    } else window.open(uri);
  }

}]);
