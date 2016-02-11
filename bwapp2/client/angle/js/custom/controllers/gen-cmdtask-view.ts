/**========================================================
 * Module: gen-cmdtask-view
 * Created by wjwong on 2/10/16.
 =========================================================*/
/// <reference path="gen-3d-engine.ts" />
/// <reference path="../../../../../model/gencmdjobsdb.ts" />
/// <reference path="../../../../../model/gencmdsdb.ts" />
/// <reference path="../../../../../server/typings/lodash/lodash.d.ts" />
/// <reference path="../../../../../server/typings/lz-string/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../services/apputils.ts" />

//http://localhost:3000/command?taskId=tnPdBFJdwx4nTnfk2&assignmentId=test&workerId=wjwong&hitId=3NFWQRSHVE0QMN56I0GPR6GA8J8FG2&turkSubmitTo=https://www.mturk.com/
interface iSceneInfo {
  _id: string, public: string, name: string, created: string,
  creator: string, block_meta: iBlockMeta, block_states: iBlockStates[]
}

angular.module('app.generate').controller('genCmdTaskCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$reactive', 'ngDialog', 'toaster','APP_CONST' , 'AppUtils', 'deviceDetector', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $reactive, ngDialog, toaster, APP_CONST, apputils, devDetect){
  "use strict";
  $reactive(this).attach($scope);
  //subscription error for onStop;
  var subErr:(err:Error)=>void = function(err:Error){if(err) console.warn("err:", arguments, err); return;};

  $scope.date = (new Date()).getTime();
  $scope.opt = {bAgreed: true, repvalidlist: [mGenCmdJobs.eRepValid[0], mGenCmdJobs.eRepValid[1], mGenCmdJobs.eRepValid[2]], repvalid: '', isValidBrowser: (devDetect.browser.toLowerCase() === 'chrome'), command: ''};

  $scope.subscribe("gencmds", ()=>{}, {
    onReady: function (sub) {
      dataReady.update('gencmds');
    },
    onStop: subErr
  });
  $scope.subscribe("gencmdjobs", ()=>{}, {
    onReady: function (sub) {
      dataReady.update('gencmdjobs');
    },
    onStop: subErr
  });

  $scope.isOpenDir = true;
  $scope.taskdata;
  $scope.taskidx = -1;
  $scope.maxtask = -1;
  $scope.cmdlist = null;
  var dataReady:iDataReady = new apputils.cDataReady(2, function():void {
    var isAdminUser = ($rootScope.currentUser) ? $rootScope.isRole($rootScope.currentUser, 'admin') : false;
    if ($stateParams.report && !isAdminUser) { //not admin we just leave it blank
      $rootScope.dataloaded = true;
      return;
    }
    if ($stateParams.taskId){ //get task information and start loading
      $scope.taskdata = <miGenCmdJobs.iGenCmdJobs>GenCmdJobs.findOne($stateParams.taskId);
      if (!$scope.taskdata) {
        $rootScope.dataloaded = true;
        $scope.assignmentId = null;
        return;
      }
      $scope = _.extend($scope, $stateParams);
      if ($scope.turkSubmitTo) $scope.submitTo = $scope.turkSubmitTo + '/mturk/externalSubmit';
      if ($scope.workerId === 'EXAMPLE') $scope.submitter = true;
      if(!$scope.assignmentId && !$stateParams.report && !$stateParams.json){
        $rootScope.dataloaded = true;
        return;
      }

      if ($scope.hitId) {
        //load hit
        $scope.hitdata = <miGenCmdJobs.iGenJobsHIT>GenCmdJobs.findOne('H_' + $scope.hitId);
        if ($scope.hitdata && $scope.hitdata.submitted && $scope.workerId && $scope.workerId !== 'EXAMPLE') {
          var subfound:miGenCmdJobs.iSubmitEle = <miGenCmdJobs.iSubmitEle>_.findWhere($scope.hitdata.submitted, {name: $scope.workerId});
          if (!_.isUndefined(subfound)) {//check if its already submitted by this worker
            //worker already submitted
            $scope.submitter = subfound;
          }
        }
      }
      var cmdid:string = $scope.taskdata.cmdid;
      if(cmdid){
        $scope.subscribe("gencmds", ()=>{return [cmdid]}, {
          onReady: function (sub) {
            $scope.curState = <iGenCmds>GenCmds.findOne(cmdid);
            //console.warn('curState',$scope.curState);
            if ($stateParams.report) { //report view
              $scope.report = $stateParams.report;
              if ($scope.submitter.valid)
                $scope.opt.repvalid = $scope.submitter.valid;
              else $scope.opt.repvalid = 'tbd';
              if ($scope.hitdata.cmdlist[$scope.workerId]) {
                $rootScope.dataloaded = true;  //turn off loading so one can quickly get data.
                /*$timeout(function () {
                  renderReport(0)
                });*/
              }
              else {
                $rootScope.dataloaded = true;
                toaster.pop('error', 'Missing annotations');
              }
            }
            else {//single item view
              $scope.maxtask = $scope.taskdata.antcnt;
              $scope.taskidx = 0;
              if (!$scope.submitter) {
                if ($scope.hitdata && $scope.hitdata.cmdlist && $scope.hitdata.cmdlist[$scope.workerId]) {
                  //we have hit data lets fast forward to the correct item to work on
                  //assume that we fill notes from pass 1 then pass 2 etc. there are no holes in the list
                  var mynotes:miGenCmdJobs.iCmdEle[][] = $scope.hitdata.cmdlist[$scope.workerId];
                  _.each(mynotes, function (n) {
                    n.forEach(function (i) {
                      if (i && i.send && i.send.input.length) $scope.taskidx++;
                    })
                  })
                }
              }
              if ($scope.taskidx || $scope.submitter) $scope.opt.bAgreed = true;
              renderTask($scope.taskidx);
              $scope.logolist = [];
              _.each($scope.curState.block_meta.blocks, function (b:iBlockMetaEle) {
                $scope.logolist.push({name: b.name, imgref: "img/textures/logos/" + b.name.replace(/ /g, '') + '.png'});
              });
            }
            /*Meteor.call('mturkReviewableHITs', {hid: $scope.hitId},  function(err, resp){
             console.warn(err,resp);
             })*/
          },
          onStop: subErr
        });
      }
      else toaster.pop('error', 'Missing Command ID');
    }
  });

  /*var renderReport = function(idx:number){
    if(_.isUndefined($scope.hitdata.cmdlist[$scope.workerId][idx])){ //stop at where the worker notes stop
      $rootScope.dataloaded = true;
      return;
    }
    if($scope.taskdata.tasktype == 'action'){
      var aidx:number = $scope.taskdata.idxlist[idx][0];
      var bidx:number = $scope.taskdata.idxlist[idx][1];
      $('#statea'+idx).empty();
      $('#stateb'+idx).empty();
      var scids = [$scope.curState.block_states[aidx].screencapid, $scope.curState.block_states[bidx].screencapid];
      $scope.subscribe('screencaps', ()=>{return [scids]}, {
        onReady: function(sub){
          var screena:iScreenCaps = ScreenCaps.findOne(scids[0]);
          var screenb:iScreenCaps = ScreenCaps.findOne(scids[1]);
          showImage(screena.data, 'Before', null, 'statea'+idx);
          showImage(screenb.data, 'After', null, 'stateb'+idx);
          renderReport(idx+1);
        },
        onStop: subErr
      });
    }
  };*/

  var renderTask = function(tidx:number){
    if($scope.taskidx != 0) $scope.isOpenDir = false;
    else $scope.isOpenDir = true;
    //convert to actual index
    var idx:number = tidx%$scope.taskdata.idxlist.length;
    //create the annotations
    if($scope.hitdata){
      if(!$scope.hitdata.cmdlist) $scope.hitdata.cmdlist = {};
      if(!$scope.hitdata.cmdlist[$scope.workerId]) $scope.hitdata.cmdlist[$scope.workerId] = {};
      if(!$scope.hitdata.cmdlist[$scope.workerId][idx]){
        $scope.hitdata.cmdlist[$scope.workerId][idx] = [];
        for(var i =0; i < $scope.taskdata.antcnt; i++)
          $scope.hitdata.cmdlist[$scope.workerId][idx].push(null);
      }
      $scope.cmdlist = $scope.hitdata.cmdlist[$scope.workerId][idx];
    }
    else{//only an example no HIT id - only need to show 1 note
      $scope.cmdlist = [];
      $scope.cmdlist.push('');
    }
    myengine.createObjects($scope.curState.block_meta.blocks);
    showFrame({block_state: $scope.curState.block_state}, ()=>{
      $scope.$apply(()=>{$rootScope.dataloaded = true;})
    });
  };

  var showFrame = function (state:iBlockStates, cb?:()=>void) {
    $scope.resetWorld();
    setTimeout(function () {
      if (state.block_state) {
        state.block_state.forEach(function (frame) {
          var c = myengine.get3DCubeById(frame.id);
          c.position = new BABYLON.Vector3(frame.position['x'], frame.position['y'], frame.position['z']);
          if (frame.rotation)
            c.rotationQuaternion = new BABYLON.Quaternion(frame.rotation['x'], frame.rotation['y'], frame.rotation['z'], frame.rotation['w']);
          c.isVisible = true;
          if(frame['showMoved']) c['showMoved'] = true;
          if (myengine.hasPhysics) c.setPhysicsState({
            impostor: BABYLON.PhysicsEngine.BoxImpostor,
            move: true,
            mass: 5, //c.boxsize,
            friction: myengine.fric,
            restitution: myengine.rest
          });
        });
      }
      else $scope.$apply(function () {
        toaster.pop('error', 'Missing BLOCK_STATE')
      });
      if (cb) cb();
    }, 100);
  };

  $scope.resetWorld = function () {
    //resetworld 
    myengine.resetWorld();
  };
  
  var convCmdToState = function(basecmd:iCmdSerial, deltacmd:iCmdSerial):iBlockStates{
    var states:iBlockStates = {block_state: []};
    var bs:{[x:string]:iBlockState} = {};
    //fill all cubes
    _.each(basecmd.world, function(l:iCmdLocEle){
      var pos:iPosRot = {x: l.loc[0], y: l.loc[1], z: l.loc[2]};
      bs[l.id] = {id: l.id, position: pos};
      bs[l.id]['showMoved'] = false;
    });
    //now fill delta
    _.each(deltacmd.world, function(l:iCmdLocEle){
      var pos:iPosRot = {x: l.loc[0], y: l.loc[1], z: l.loc[2]};
      bs[l.id] = {id: l.id, position: pos};
      bs[l.id]['showMoved'] = true;
    });
    _.each(bs, function(s:iBlockState){
      states.block_state.push(s);
    });
    return states;
  };

  /*var showImage = function(b64i:string, title:string, caption:string, attachID:string){
    if(!attachID) return console.warn('Missing dom attach id');
    var canvas = {width: 480, height: 360};
    var b64img:string = LZString.decompressFromUTF16(b64i);

    var eleDivID:string = 'div' + $('div').length; // Unique ID
    var eleImgID:string = 'img' + $('img').length; // Unique ID
    var eleLabelID:string = 'label' + $('label').length; // Unique ID
    var htmlout = '<img id="'+eleImgID+'" style="width:'+canvas.width+'px;height:'+canvas.height+'px"></img>';
    if(title) htmlout = '<h3>'+title+'</h3>' + htmlout;
    if(caption) htmlout += '<label id="'+eleLabelID+'" class="mb">'+caption+'</label>';
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-12')
      .html(htmlout).css({}).appendTo('#'+attachID);

    var img:HTMLImageElement = <HTMLImageElement>document.getElementById(eleImgID); // Use the created element
    img.src = b64img;
  };*/
  
  $scope.remCmd = function(idx:number){
    console.warn('remcmd ', $scope.taskidx, idx);
    $scope.taskidx = idx;
    $scope.cmdlist[idx] = null;
    delete $scope.hitdata.timed[$scope.workerId][idx];//erase previous time
    var setdata:{[x: string]:any} = {};
    setdata['cmdlist.'+$scope.workerId] = $scope.hitdata.cmdlist[$scope.workerId];
    setdata['timed.'+$scope.workerId] = $scope.hitdata.timed[$scope.workerId];
    console.warn('setdata', setdata);
    GenCmdJobs.update({_id: $scope.hitdata._id}, {
      $set: setdata
    }, function(err, ret) {
      if (err) return toaster.pop('error', err.reason);
      $scope.$apply(()=>{
      });
    })
  };

  $scope.submit = function(command:string){
    $rootScope.dataloaded = false;
    if($scope.submitter){
      //if($scope.taskidx != 0) $scope.isOpenDir = false;
      $scope.isOpenDir = true;
      //read only - submission already done
      if($scope.taskidx >= $scope.taskdata.idxlist.length) $scope.taskidx = 0;
      renderTask($scope.taskidx);
    }
    else{//new entry save as we go
      if($scope.hitId){
        //error check length
        var myWords:string[] = command.replace(/ +/g,' ').split(' ');
        if(myWords.length < 4){
          toaster.pop('error', 'Not enough words used in description');
          $rootScope.dataloaded = true;
          return;
        }
        var cmdele:iCmdSerial = serialState(command);
        if(cmdele){
          //submit to AI system simulate wait
          setTimeout(()=> {
            Meteor.call('cmdMovePost', cmdele, function (err, ret) {
              if (err) return $scope.$apply(function () {
                toaster.pop('error', err)
              });
              if (ret.error) return $scope.$apply(function () {
                toaster.pop('error', ret.error)
              });
              if (ret.result) {
                var cmdoutput:iCmdSerial = ret.result;
                if(cmdoutput && !cmdoutput.error){
                  PostMove(cmdoutput)
                }
                else toaster.pop('error', cmdoutput.error);
              }
              else console.warn(err, ret);
            })
          }, 1000);

          function PostMove(cmdoutput:iCmdSerial){
            var states:iBlockStates = convCmdToState(cmdele, cmdoutput);
            showFrame(states, function(){
              $scope.cmdlist[$scope.taskidx] = <miGenCmdJobs.iCmdEle>{send: cmdele, recv: cmdoutput, rate: -1};

              var previdx:number = $scope.taskidx; //get actual index
              $scope.taskidx += 1;

              if(!$scope.hitdata.timed) $scope.hitdata.timed = {};
              if(!$scope.hitdata.timed[$scope.workerId]) $scope.hitdata.timed[$scope.workerId] = {};
              if(!$scope.hitdata.timed[$scope.workerId][previdx]) $scope.hitdata.timed[$scope.workerId][previdx] = (new Date()).getTime();

              //must use update instead of save because _id is custom generated
              var setdata:{[x: string]:any} = {};
              setdata['cmdlist.'+$scope.workerId] = $scope.hitdata.cmdlist[$scope.workerId];
              setdata['timed.'+$scope.workerId] = $scope.hitdata.timed[$scope.workerId];
              GenCmdJobs.update({_id: $scope.hitdata._id}, {
                $set: setdata
              }, function(err, ret){
                if(err) return toaster.pop('error', err.reason);
                $scope.$apply(()=>{
                  $scope.opt.command = '';
                  $rootScope.dataloaded = true;
                })

                //renderTask($scope.taskidx);

                /*if($scope.taskidx >= $scope.maxtask && $scope.assignmentId && $scope.assignmentId != 'ASSIGNMENT_ID_NOT_AVAILABLE'){
                 //submission assignment as done
                 if(!$scope.hitdata.submitted) $scope.hitdata.submitted = [];
                 var subfound:miGenCmdJobs.iSubmitEle = <miGenCmdJobs.iSubmitEle>_.findWhere($scope.hitdata.submitted, {name: $scope.workerId});
                 if(_.isUndefined(subfound)){
                 $scope.hitdata.submitted.push({
                 name: $scope.workerId,
                 time: (new Date()).getTime(),
                 aid: $scope.assignmentId,
                 submitto: $scope.turkSubmitTo
                 });
                 $scope.submitter = $scope.hitdata.submitted[$scope.hitdata.submitted.length-1];
                 $scope.taskidx = 0;
                 GenCmdJobs.update({_id: $scope.hitdata._id}, {
                 $addToSet: {
                 submitted: $scope.submitter
                 }
                 }, function(err, ret){
                 console.warn('hit', err, ret);
                 if(err) return toaster.pop('error', err);
                 $scope.$apply(function(){toaster.pop('info', 'HIT Task Submitted')});
                 $('form[name="submitForm"]').submit(); //submit to turk
                 });
                 }
                 }
                 else renderTask($scope.taskidx);*/
              });
            });
          }
        }
      }
      else toaster.pop('error', 'Missing HIT Id');
    }
  };

  var serialState = function (cmd:string):iCmdSerial {
    var cmdserial:iCmdSerial = {
      world: null,
      input: cmd,
      version: 1
    };

    var newblock_state:iCmdLocEle[] = [];
    var block_state:iBlockState[] = $scope.curState.block_state;
    var cubesused:number[] = [];
    $scope.curState.block_meta.blocks.forEach(function(b){
      cubesused.push(b.id);
    });
    cubesused = _.uniq(cubesused);
    var isValid:boolean = true;
    var max:number = APP_CONST.fieldsize / 2 + 0.1; //give it a little wiggle room
    var min:number = -max;
    var frame:iBlockState[] = [];
    var meta:iBlockMeta = {blocks: []};
    cubesused.forEach(function(cid:number) {
      var c = myengine.get3DCubeById(cid);
      if (c) {
        if ((c.position.x - c.boxsize / 2) >= min && (c.position.x + c.boxsize / 2) <= max &&
          (c.position.z - c.boxsize / 2) >= min && (c.position.z + c.boxsize / 2) <= max) {
          var dat:iBlockState = {
            id: cid,
            position: <any>c.position.clone(),
            rotation: <any>c.rotationQuaternion.clone()
          };
          frame.push(dat);
          meta.blocks.push(myengine.cubesdata[cid].meta);
        }
        else {
          isValid = false;
          console.warn('Out',c.position.x- c.boxsize/2, c.position.x+ c.boxsize/2,c.position.z- c.boxsize/2, c.position.z+ c.boxsize/2, cid, c);
        }
      }
    });
    if(!isValid){
      toaster.pop('error','Cube(s) Out of Bounds!');
      return null;
    }

    for (var i = 0; i < frame.length; i++) {
      var s = frame[i];
      var pos:number[] = [];
      _.each(s.position, function (v) {
        pos.push(v);
      });
      newblock_state.push({id: s.id, loc: pos});
    }

    cmdserial.world = newblock_state;
    return cmdserial;
  };

  $scope.updateReport = function(idx: number, form: angular.IFormController){
    var setdata:{[x: string]:any} = {};
    setdata['cmdlist.'+$scope.workerId] = $scope.hitdata.cmdlist[$scope.workerId];
    GenCmdJobs.update({_id: $scope.hitdata._id}, {
      $set: setdata
    }, function(err, ret){
      if(err) return toaster.pop('error', err.reason);
      form.$setPristine();
    });
  };

  $scope.validateReport = function(opt: string){
    var subidx:number = _.findIndex<miGenCmdJobs.iSubmitEle>($scope.hitdata.submitted, function(v:miGenCmdJobs.iSubmitEle){return v.name == $scope.workerId});
    if(subidx>-1) {
      $scope.submitter.valid = opt;
      var setdata:{[x: string]:any} = {};
      setdata['submitted.'+subidx] = $scope.submitter;
      GenCmdJobs.update({_id: $scope.hitdata._id}, {
        $set: setdata
      }, function(err, ret){
        if(err) return toaster.pop('error', err.reason);
      });
    }
  };
  
  $scope.dlScene = function(){
    var content:string = JSON.stringify($scope.curState, null, 2);
    var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content);
    apputils.saveAs(uriContent, 'bw_scene_'+$scope.curState._id+'.json');
  };

  $scope.dlStates = function(){
    var content:string = JSON.stringify($scope.taskdata, null, 2);
    var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content);
    apputils.saveAs(uriContent, 'bw_states_'+$scope.taskdata._id+'.json');
  };

  $scope.dlNotes = function(){
    var content:string = JSON.stringify($scope.hitdata, null, 2);
    var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content);
    apputils.saveAs(uriContent, 'bw_notes_'+$scope.hitdata.HITId+'.json'); //+'_'+$scope.workerId+'.json');
  };

  // Start by calling the createScene function that you just finished creating
  var myengine:miGen3DEngine.c3DEngine = new mGen3DEngine.c3DEngine(APP_CONST.fieldsize);
  myengine.createWorld();
  dataReady.update('world created');

}]);
