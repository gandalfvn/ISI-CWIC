/**========================================================
 * Module: gen-task-view.js
 * Created by wjwong on 10/5/15.
 =========================================================*/

//?taskid=2kw6CqcqjRzsHBWD2&assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE&hitId=123RVWYBAZW00EXAMPLE&turkSubmitTo=https://www.mturk.com/&workerId=AZ3456EXAMPLE

angular.module('angle').controller('genTaskCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', 'Utils', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, utils){
  "use strict";
  
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

  $scope.taskdata;
  $scope.taskidx = 0;
  $scope.notes = null;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 1){
      $rootScope.dataloaded = true;
      console.warn($stateParams);
      if($stateParams.taskId){
        $scope.taskdata = GenJobsMgr.findOne($stateParams.taskId);
        if($stateParams.workerId){
          $scope.workerId = $stateParams.workerId;
          var isValid = true;
          if(!$scope.workerId) isValid = false; //no workid no view
          if($scope.taskdata.submitted && isValid){
            if(!_.isUndefined($scope.taskdata.submitted[$scope.workerId])){
              //worker already submitted
              $scope.submitter = $scope.taskdata.submitted[$scope.workerId];
            }
          }
          if(isValid) showTask($scope.taskdata.stateid);
        }
      }
    }
  };
  
  var showTask = function(sid){
    $scope.$meteorSubscribe("genstates", sid).then(
      function(val){
        $scope.curState = GenStates.findOne(sid);
        console.warn($scope.curState);
        $scope.taskidx = 0;
        renderTask($scope.taskidx);
      },
      function(err){
        toaster.pop('error', sid+' Not Found', err.reason);
      }
    );
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
      showImage($scope.curState.block_states[aidx].screencap, 'Before', null, 'statea');
      showImage($scope.curState.block_states[bidx].screencap, 'After', null, 'stateb');
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
    if($scope.submitter){
      //read only submisson already done
      if($scope.taskidx >= $scope.taskdata.idxlist.length) $scope.taskidx = 0;
      renderTask($scope.taskidx);
    }
    else{//new entry save as we go
      var isValid = true;
      if($scope.taskidx >= $scope.taskdata.idxlist.length && $stateParams.assignmentId && $stateParams.assignmentId == 'ASSIGNMENT_ID_NOT_AVAILABLE'){
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

}]);
