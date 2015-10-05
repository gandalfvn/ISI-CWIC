/**========================================================
 * Module: gen-task-view.js
 * Created by wjwong on 10/5/15.
 =========================================================*/

//?taskid=2kw6CqcqjRzsHBWD2&assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE&hitId=123RVWYBAZW00EXAMPLE&turkSubmitTo=https://www.mturk.com/&workerId=AZ3456EXAMPLE

angular.module('angle').controller('genTaskCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster){
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

  var taskdata;
  var taskidx = 0;
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
      console.warn($stateParams);
      taskdata = GenJobsMgr.findOne($stateParams.taskid);
      showTask(taskdata.sidlist[taskidx]);
    }
  };
  
  var showTask = function(tid){
    $scope.$meteorSubscribe("genstates", tid).then(
      function(val){
        $scope.curtask = GenStates.findOne(tid);
        console.warn($scope.curtask);
      },
      function(err){
        toaster.pop('error', tid+' Not Found', err.reason);
      }
    );
  };

  var showImage = function(b64, title, caption, attachID){
    var u8_2 = $rootScope.StringToUint8(b64);
    var myviewport = {width: 320, height: 220};

    var eleDivID = 'div' + $('div').length; // Unique ID
    var eleCanID = 'canvas' + $('canvas').length; // Unique ID
    var eleLabelID = 'h4' + $('h4').length; // Unique ID
    var htmlout =
      '<canvas id="'+eleCanID+'" style="width:'+myviewport.width+'px;height:'+myviewport.height+'px"></canvas>';
    if(title) htmlout = '<h4>'+title+'</h4>' + htmlout;
    if(caption) htmlout += '<label id="'+eleLabelID+'" class="mb">'+caption+'</label>';
    console.warn('showImage', caption);
    var attachTo = '#galleryarea';
    if(attachID) attachTo = '#'+attachID;
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-4')
      .html(htmlout).css({}).appendTo(attachTo);

    var screendisp = document.getElementById(eleCanID); // Use the created element
    screendisp.width = myviewport.width;
    screendisp.height = myviewport.height;
    var context = screendisp.getContext('2d');
    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(myviewport.width, myviewport.height);
    var data = imageData.data;
    for (var i = 0, len = u8_2.length; i < len; i++) {
      data[i] = u8_2[i];
    }
    context.putImageData(imageData, 0, 0);
  };
  
}]);
