/**========================================================
 * Module: gen-pred-view.ts
 * Created by wjwong on 9/9/15.
 =========================================================*/
/// <reference path="gen-3d-engine.ts" />
/// <reference path="../../../../../model/genstatesdb.ts" />
/// <reference path="../../../../../model/screencapdb.ts" />
/// <reference path="../../../../../public/vendor/lz-string/typings/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/lodash/lodash.d.ts" />
/// <reference path="../../../../../public/vendor/babylonjs/babylon.2.2.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../services/apputils.ts" />

interface iPredPUGS {
  predicted_state: miGen3DEngine.iBlockStatesSerial,
  utterance: string[][]
  gold_state: miGen3DEngine.iBlockStatesSerial,
  start_state: miGen3DEngine.iBlockStatesSerial
}
interface iPredBlock {
  block_meta: iBlockMeta,
  predictions: iPredPUGS[]
}

angular.module('app.generate').controller('genPredCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', 'toaster', 'APP_CONST', 'ngTableParams', 'AppUtils', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, toaster, APP_CONST, ngTableParams, apputils){
    "use strict";

    var mult:number = 100; //position multiplier for int random
    var checkFnSS:number; //store steady state check

    $scope.curState = new apputils.cCurrentState();

    var genstates = $scope.$meteorCollection(GenStates);
    $scope.$meteorSubscribe("genstates").then(
      function(sid){dataReady.update('genstates');},
      function(err){ console.log("error", arguments, err); }
    );

    var screencaps = $scope.$meteorCollection(ScreenCaps);
    $scope.$meteorSubscribe("screencaps").then(
      function(sid){dataReady.update('screencaps');},
      function(err){ console.log("error", arguments, err); }
    );

    var dataReady:iDataReady = new apputils.cDataReady(2, function():void{
      updateTableStateParams();
      $rootScope.dataloaded = true;
    });

    var updateTableStateParams = function(){
      var data:iGenStates[] = GenStates.find({}, {sort: {"_id": 1}}).fetch();
      $scope.tableStateParams = new ngTableParams({
        count: 5,
        sorting: {created: 'desc'}
      }, {counts: [5,10,20],
        paginationMaxBlocks: 8,
        paginationMinBlocks: 2,
        data: data});
    };

    $scope.resetWorld = function(){
      //resetworld 
      myengine.resetWorld();
    };
    
    var showFrame = function(state:iBlockStates, cb?: ()=>void){
      $scope.resetWorld();
      setTimeout(function(){
        if(state.block_state){
          state.block_state.forEach(function(frame){
            var c = myengine.get3DCubeById(frame.id);
            c.position = new BABYLON.Vector3(frame.position['x'], frame.position['y'], frame.position['z']);
            if(frame.rotation)
              c.rotationQuaternion = new BABYLON.Quaternion(frame.rotation['x'], frame.rotation['y'], frame.rotation['z'], frame.rotation['w']);
            c.isVisible = true;
            if(myengine.hasPhysics) c.setPhysicsState({
              impostor: BABYLON.PhysicsEngine.BoxImpostor,
              move: true,
              mass: 5, //c.boxsize,
              friction: myengine.fric,
              restitution: myengine.rest
            });
          });
        }
        else $scope.$apply(function(){toaster.pop('error', 'Missing BLOCK_STATE')});
        if(cb) cb();
      }, 100);
    };

    var showImage = function(b64i:string, text:string, attachID?:string){
      var b64img:string = LZString.decompressFromUTF16(b64i);

      var eleDivID:string = 'div' + $('div').length; // Unique ID
      var eleImgID:string = 'img' + $('img').length; // Unique ID
      //var eleLabelID:string = 'h4' + $('h4').length; // Unique ID
      var htmlout:string = '';
      if(text) htmlout += '<b>'+text+'</b><br>';
      htmlout += '<img id="'+eleImgID+'" style="width:'+myengine.canvas.width+'px;height:'+myengine.canvas.height+'px"></img>';
      // + '<label id="'+eleLabelID+'" class="mb"> '+id+'</label>';
      var attachTo = '#galleryarea';
      if(attachID) attachTo = '#'+attachID;
      $('<div>').attr({
        id: eleDivID
      }).addClass('col-sm-12')
        .html(htmlout).css({}).appendTo(attachTo);

      var img:HTMLImageElement = <HTMLImageElement>document.getElementById(eleImgID); // Use the created element
      img.src = b64img;
    };


    $scope.clearMeta = function(){
      $('#galleryarea').empty();
      $scope.curState.clear();
      $state.transitionTo('app.genworld', {}, {notify: false});
    };

    var setDecorVal = function(decor){
      if(decor){
        $scope.$apply(function(){
          //set switches
          switch(decor){
            case cBlockDecor.digit:
              $scope.opt.showImages = true;
              $scope.opt.showLogos = false;
              break;
            case cBlockDecor.logo:
              $scope.opt.showImages = true;
              $scope.opt.showLogos = true;
              break;
            case cBlockDecor.blank:
              $scope.opt.showImages = false;
              $scope.opt.showLogos = false;
              break;
          }
        })
      }
    };

    $scope.statesFileChanged = function(event){
      $scope.$apply(function(){$scope.statesfilename = event.target.files;});
    };

    /**
     * Transform text block state from cwic to internal block states
     * @param bs
     * @returns {Array}
     */
    var mungeBlockState = function(bs:miGen3DEngine.iBlockStateSerial[]):iBlockState[]{
      var newBS:iBlockState[] = [];
      bs.forEach(function(b){
        var li:string[] = b.position.split(',');
        var lv:number[] = [];
        li.forEach(function(v,i){lv.push(Number(v))});
        if(b.rotation){
          var ri:string[] = b.rotation.split(',');
          var rv:number[] = [];
          ri.forEach(function(v, i){
            rv.push(Number(v))
          });
          newBS.push({id: b.id, position: {
            x: lv[0], y: lv[1], z: lv[2]
          }, rotation: {
            x: rv[0], y: rv[1], z: rv[2], w: rv[3]
          }})
        }
        else
          newBS.push({id: b.id, position: {
            x: lv[0], y: lv[1], z: lv[2]
          }})

      });
      return newBS;
    };

    $scope.loadStates = function(){
      if($scope.statesfilename && $scope.statesfilename.length){
        //read file
        var reader = new FileReader();
        reader.onload = function(){
          var filedata:iPredBlock = JSON.parse(reader.result);
          console.warn(filedata);
          if(filedata.block_meta && filedata.block_meta.blocks && filedata.block_meta.blocks.length
            && filedata.predictions && filedata.predictions.length){
            console.warn('valid file');
            /*$scope.$apply(function(){
             $scope.impFilename = null;
             $scope.enableImpSave = false;
             });*/
            $scope.curState.clear();
            $scope.curState.block_meta = filedata.block_meta;
            $scope.curState.public = true;
            $scope.curState.created = (new Date).getTime();
            $scope.curState.creator = $rootScope.currentUser._id;
            $scope.curState.name = $scope.statesfilename[0].name;
            $scope.predictions = filedata.predictions;
            setDecorVal(filedata.block_meta.decoration);
            myengine.createObjects($scope.curState.block_meta.blocks);
            console.warn($scope.curState.block_meta);
            diffPrediction(0);
            $scope.showPrediction(0);
          }
          else $scope.$apply(function(){toaster.pop('warn', 'Invalid JSON STATE file')});
        };

        reader.readAsText($scope.statesfilename[0]);
      }
    };

    
    var diffPrediction = function(idx:number):iBlockState[]{
      var p = $scope.predictions[idx];

      var goldbs:iBlockState[] = mungeBlockState(p['gold_state'].block_state);
      var predbs:iBlockState[] = mungeBlockState(p['predicted_state'].block_state);

      interface iIDPosRot{[x:number]:iPosRot};
      //create an associative array of position and id - then we will remove each predicted cube that ovdr lap with gold
      var predlist:iIDPosRot = {};
      _.each(predbs, function(p){
        predlist[p.id] = p.position;
      })
      console.warn(predlist);
      //now iterate gold blocks list and start removing prediction blocks when they cover each other
      //whats left in predlist and not found from gold is the non overlap 
      function remOverlap(idx:number, gbs:iBlockState[], predl:iIDPosRot,uniqs:iBlockState[], cb:()=>void){
        if(_.isUndefined(gbs[idx])) return cb();
        var bFound:boolean = false;
        _.each(predl, function(p:iPosRot, k){
          //only match one block to one block not one gbs block to more than one predicted block
          if(!bFound){
            var subp:iPosRot = subtractPos(gbs[idx].position, p);
            if(isZeroPos(subp)){
              delete predl[k];
              bFound = true;
            }
          }
        })
        if(!bFound){
          gbs[idx]['type'] = 'g'; //hack a type into this :)
          uniqs.push(gbs[idx]);
        }
        remOverlap(idx+1, gbs, predl, uniqs, cb);
      }

      var uniqlist:iBlockState[] = [];
      remOverlap(0, goldbs, predlist, uniqlist, function(){
        //save whats left of blocks in predicted view
        _.each(predlist, function(p:iPosRot,k){
          var val:iBlockState = {id: k, position: p};
          val['type'] = 'p'; //hack a type into this :)
          uniqlist.push(val);
        })
      })

      return uniqlist;
    };
    
    var subtractPos = function(a:iPosRot, b:iPosRot):iPosRot{
      var retv:iPosRot = <iPosRot>_.extend({}, a);
      _.each(retv, function(v,k){
        retv[k] = retv[k] - b[k];
      })
      return retv;
    }

    var isZeroPos = function(p:iPosRot):boolean{
      var isz = true;
      _.each(p, function(v){
        if (v < -0.001 || v > 0.001) isz = false;
      })
      return isz;
    }

    $scope.showPrediction = function(idx:number){
      if(_.isUndefined($scope.predictions[idx])) return;
      $scope.isgen = true;
      $scope.curitr = idx;
      var pidx = ['start_state', 'gold_state', 'predicted_state'];
      _.each(pidx, function(aid){
        $('#'+aid).empty();
      })
      function itrFrame(idx: number, idxlist:string[], cb:()=>void){
        if(_.isUndefined(idxlist[idx])) return cb();
        var k = idxlist[idx];
        var blockdata:miGen3DEngine.iBlockStatesSerial = $scope.predictions[idx][k];
        if($scope.curState.block_meta.blocks.length != blockdata.block_state.length) return $scope.$apply(function(){
          toaster.pop('error', 'Block META and STATE mismatch!');
        });
        //mung block_states
        var block_state:iBlockStates = {block_state: mungeBlockState(blockdata.block_state)};

        showFrame(block_state, function(){
          //wait for steady state
          checkFnSS = setInterval(function(){
            if(myengine.isSteadyState){
              clearInterval(checkFnSS);
              var sc = BABYLON.Tools.CreateScreenshot(myengine.engine, myengine.camera, {
                width: myengine.canvas.width, height: myengine.canvas.height
              }, function(b64i: string){
                var b64img:string = LZString.compressToUTF16(b64i);
                //block_state.screencap = b64img;
                //block_state.created = (new Date).getTime();
                //var attachid:string = createButtons('stateimg', idx);
                showImage(b64img, k.toUpperCase().replace(/_/g,' '), k);
                itrFrame(idx+1, idxlist, cb);
              });
            }
          }, 100);
        });
      }

      itrFrame(0, pidx, function(){
        $scope.$apply(function(){
          $scope.isgen = false;
        })
      });
    };

    // Start by calling the createScene function that you just finished creating
    var myengine:miGen3DEngine.c3DEngine = new mGen3DEngine.c3DEngine(APP_CONST.fieldsize);

    $scope.opt = myengine.opt;
    $scope.opt.limStack = true; //we add a stack limit to 3d engine vars
    $scope.isgen = false;
    console.warn(myengine.opt);
    myengine.createWorld();
    dataReady.update('world created');
  }]);