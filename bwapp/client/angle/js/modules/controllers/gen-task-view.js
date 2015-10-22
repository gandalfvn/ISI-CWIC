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

  $scope.taskdata;
  $scope.taskidx = 0;
  $scope.notes = null;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 2){
      console.warn($stateParams);
      var isAdminUser = ($rootScope.currentUser)? $rootScope.isRole($rootScope.currentUser, 'admin') : false;
      if($stateParams.report && !isAdminUser){
        $rootScope.dataloaded = true;
        return;
      }
      if($stateParams.taskId){
        $scope.taskdata = GenJobsMgr.findOne($stateParams.taskId);
        console.warn('taskdata', $scope.taskdata);
        if($stateParams.workerId){
          $scope.workerId = $stateParams.workerId;
          if($scope.workerId === 'EXAMPLE') $scope.submitter = true;
          var isValid = true;
          if(!$scope.workerId) isValid = false; //no workid no view
          if($scope.taskdata.submitted && isValid){
            if(!_.isUndefined($scope.taskdata.submitted[$scope.workerId])){
              //worker already submitted
              $scope.submitter = $scope.taskdata.submitted[$scope.workerId];
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
            },
            function(err){
              console.warn('err', err);
              $scope.$apply(function(){toaster.pop('error', sid+' Not Found', err.reason)});
            }
          );
        }
      }
    }
  };

  var renderReport = function(idx){
    if(_.isUndefined($scope.taskdata.idxlist[idx])) return;
    if($scope.taskdata.tasktype == 'action'){
      var aidx = $scope.taskdata.idxlist[idx];
      var bidx = ($scope.taskdata.movedir == 'reverse')? aidx-1 : aidx+1;
      console.warn($('#statea'+idx));
      $('#statea'+idx).empty();
      $('#stateb'+idx).empty();
      var scids = [$scope.curState.block_states[aidx].screencapid, $scope.curState.block_states[bidx].screencapid];
      $scope.$meteorSubscribe('screencaps', scids).then(
        function(sub){
          var screena = ScreenCaps.findOne(scids[0]);
          var screenb = ScreenCaps.findOne(scids[1]);
          showImage(screena.data, 'Before', null, 'statea'+idx);
          showImage(screenb.data, 'After', null, 'stateb'+idx);
          $rootScope.dataloaded = true;
          renderReport(idx+1);
        }
      );
    }
  };
  
  var renderTask = function(idx){
    //create the annotations
    if(!$scope.taskdata.notes) $scope.taskdata.notes = {};
    if(!$scope.taskdata.notes[$scope.workerId]) $scope.taskdata.notes[$scope.workerId] = {};
    if(!$scope.taskdata.notes[$scope.workerId][idx]) $scope.taskdata.notes[$scope.workerId][idx] = ['','',''];
    $scope.notes = $scope.taskdata.notes[$scope.workerId][idx];
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
  
  var showImage = function(b64, title, caption, attachID){
    if(!attachID) return console.warn('Missing dom attach id');
    var u8_2 = utils.StringToUint8(b64);
    var canvas = {width: 384, height: 264};

    var eleDivID = 'div' + $('div').length; // Unique ID
    var eleCanID = 'canvas' + $('canvas').length; // Unique ID
    var eleLabelID = 'h4' + $('h4').length; // Unique ID
    var htmlout =
      '<canvas id="'+eleCanID+'" style="width:'+canvas.width+'px;height:'+canvas.height+'px"></canvas>';
    if(title) htmlout = '<h4>'+title+'</h4>' + htmlout;
    if(caption) htmlout += '<label id="'+eleLabelID+'" class="mb">'+caption+'</label>';
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-4')
      .html(htmlout).css({}).appendTo('#'+attachID);

    var screendisp = document.getElementById(eleCanID); // Use the created element
    screendisp.width = canvas.width;
    screendisp.height = canvas.height;
    var context = screendisp.getContext('2d');
    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0, len = u8_2.length; i < len; i++) {
      data[i] = u8_2[i];
    }
    context.putImageData(imageData, 0, 0);
  };
  
  $scope.itrAnnot = function(notes, vdir){
    $scope.taskidx+=vdir;
    $rootScope.dataloaded = false;
    if($scope.submitter){
      //read only submisson already done
      if($scope.taskidx >= $scope.taskdata.idxlist.length) $scope.taskidx = 0;
      renderTask($scope.taskidx);
    }
    else{//new entry save as we go
      var isValid = true;
      if($scope.taskidx >= $scope.taskdata.idxlist.length && $stateParams.assignmentId && $stateParams.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE'){
        $rootScope.dataloaded = true;
        $scope.taskidx = $scope.taskdata.idxlist.length - 1;
        isValid = false; //prevent final submission until accepted
        toaster.pop('info', 'Please ACCEPT assignment before submitting.');
      }
      if($scope.taskidx >= $scope.taskdata.idxlist.length && $stateParams.assignmentId && $stateParams.assignmentId != 'ASSIGNMENT_ID_NOT_AVAILABLE'){
        if(!$scope.taskdata.submitted) $scope.taskdata.submitted = {};
        if(!$scope.taskdata.submitted[$scope.workerId]){
          $scope.taskdata.submitted[$scope.workerId] = {
            time: (new Date()).getTime(),
            aid: $stateParams.assignmentId,
            hid: $stateParams.hitId
          };
          $scope.submitter = $scope.taskdata.submitted[$scope.workerId];
          $scope.taskidx = 0;
          toaster.pop('info', 'Task Submitted');
        }
      }
      if(isValid) genjobsmgr.save($scope.taskdata).then(function(val){
        renderTask($scope.taskidx);
      }, function(err){
        toaster.pop('error', err.reason);
      });
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
      console.warn('here');
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
