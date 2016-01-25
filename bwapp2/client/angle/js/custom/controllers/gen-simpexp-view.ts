/**
 * Created by wjwong on 12/16/15.
 */
/// <reference path="gen-3d-engine.ts" />
/// <reference path="../../../../../model/genexpsdb.ts" />
/// <reference path="../../../../../server/typings/lodash/lodash.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/lz-string/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../services/apputils.ts" />

angular.module('app.generate').controller('genSimpExpCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', 'toaster', 'APP_CONST', 'DTOptionsBuilder', 'AppUtils', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, toaster, APP_CONST, DTOptionsBuilder, apputils) {
  "use strict";

  var mult:number = 100; //position multiplier for int random

  $scope.dtOptionsBootstrap = DTOptionsBuilder.newOptions()
    .withBootstrap()
    .withBootstrapOptions({
      pagination: {
        classes: {
          ul: 'pagination pagination-sm'
        }
      }
    });

  $scope.dtOptionsAvail = _.extend({}, $scope.dtOptionsBootstrap, {
    "lengthMenu": [[5], [5]],
    "order": [[3, "desc"]],
    "language": {"paginate": {"next": '▶', "previous": '◀'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  });

  $scope.curState = new apputils.cCurrentState();

  var genexps = $scope.$meteorCollection(GenExps);
  $scope.$meteorSubscribe("genexps").then(
    function (sid) {
      dataReady.update('genexps');
    },
    function (err) {
      console.log("error", arguments, err);
    }
  );
  
  var dataReady:iDataReady = new apputils.cDataReady(1, function ():void {
    updateAvailExp();
    if ($stateParams.sid) {
      $scope.showState($stateParams.sid);
    }
    else $rootScope.dataloaded = true;
  });

  var updateAvailExp = function () {
    $scope.availExp = <iGenExps[]>GenExps.find({}, {sort: {"_id": 1}}).fetch();
  };

  $scope.resetWorld = function () {
    //resetworld 
    myengine.resetWorld();
  };

  /**
   * Check for cube overlap and increase height based on in order cube creation so updates to mycube y is correct
   * @param mycube - current cube
   * @param used - list of cubes already created in fifo order
   * @param idxdata - index associative array to get prev cube positions
   */
  var updateYCube = function (mycube:miGen3DEngine.iCubeState, used:number[], idxdata:miGen3DEngine.iCubeStateAsc) {
    var myArr = [];
    used.forEach(function (c) {
      myArr.push(c);
    });
    for (var i = 0; i < myArr.length; i++) {
      var c = idxdata[myArr[i]];
      if (myengine.intersectsMeshXYZ(mycube, c, true)) {
        //console.warn('intersect', mycube.prop.cid, mycube.position, c.prop.cid, c.position);
        //half of the size of the cube is from base cube other half from current cube
        mycube.position.y = c.position.y + c.prop.size / 2 + mycube.prop.size / 2;
      }
    }
  };

  /**
   * generate cube close to anchor cube if there is none then we just generate cube via field.
   * returns null or vector3 position.
   * @param size
   * @param used
   * @param idxdata
   * @returns {*}
   */
  var genCubeNear = function (size:number, used:number[], idxdata:miGen3DEngine.iCubeStateAsc):miGen3DEngine.iCubeMove {
    if (used.length) {
      var myArr:number[] = used; //its an array
      var halfsize:number = size / 2;
      var halfrad:number = APP_CONST.fieldsize / 4; //near radius
      var anchorIdx:number = myArr[apputils.rndInt(0, myArr.length - 1)];
      var aPos:BABYLON.Vector3 = idxdata[anchorIdx].position;
      var fieldmin:number = -(APP_CONST.fieldsize / 2) + (size / 2);
      var fieldmax:number = (APP_CONST.fieldsize / 2) - (size / 2);
      var min:number = -halfrad + halfsize;
      var max:number = halfrad - halfsize;
      var val:number = APP_CONST.fieldsize;
      var it:number = 0;
      while (val > fieldmax || val < fieldmin) {
        val = apputils.rndInt(min * mult, max * mult) / mult + aPos.x;
        if (it > 50) {
          console.warn('it > 50 posx:', val);
        }
        ;
      }
      var xval:number = val;
      val = APP_CONST.fieldsize;
      it = 0;
      while (val > fieldmax || val < fieldmin) {
        val = apputils.rndInt(min * mult, max * mult) / mult + aPos.z;
        if (it > 50) {
          console.warn('it > 50 posz:', val);
        }
        ;
      }
      var zval:number = val;
      return {anchorCid: anchorIdx, position: new BABYLON.Vector3(xval, halfsize, zval)};
    }
    console.error('no existing cubes found');
    return null
  };

  var genCubeFar = function (size, used:number[], idxdata:miGen3DEngine.iCubeStateAsc):miGen3DEngine.iCubeMove {
    if (used.length) {
      var myArr:number[] = used; //its an array
      var halfsize:number = size / 2;
      var halfrad:number = APP_CONST.fieldsize / 4; //avoid radius
      var anchorIdx:number = myArr[apputils.rndInt(0, myArr.length - 1)];
      var aPos:BABYLON.Vector3 = idxdata[anchorIdx].position;
      var fieldmin:number = -(APP_CONST.fieldsize / 2) + (size / 2);
      var fieldmax:number = (APP_CONST.fieldsize / 2) - (size / 2);
      var min:number = -halfrad + halfsize;
      var max:number = halfrad - halfsize;
      var val:{x:number, z:number} = {x: APP_CONST.fieldsize, z: APP_CONST.fieldsize};
      var it:number = 0;
      while (val.x > fieldmax || val.x < fieldmin ||
      val.z > fieldmax || val.z < fieldmin ||
      (val.x > aPos.x + min && val.x < aPos.x + max
      && val.z > aPos.z + min && val.z < aPos.z + max)) {
        val.x = apputils.rndInt(fieldmin * mult, fieldmax * mult) / mult;
        val.z = apputils.rndInt(fieldmin * mult, fieldmax * mult) / mult;
        it++;
        if (it > 50) console.warn('it > 50 pos:', val);
      }
      return {anchorCid: anchorIdx, position: new BABYLON.Vector3(val.x, halfsize, val.z)};
    }
    console.error('no existing cubes found');
    return null
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

  /*var findBy = function(type:string, key:string, collection:any){
   return _.find(collection, function(a){return key === a[type]});
   };*/

  var showImage = function (b64i:string, text:string, attachID:string) {
    var b64img:string = LZString.decompressFromUTF16(b64i);

    var eleDivID:string = 'div' + $('div').length; // Unique ID
    var eleImgID:string = 'img' + $('img').length; // Unique ID
    //var eleLabelID:string = 'h4' + $('h4').length; // Unique ID
    var htmlout:string = '';
    if (text) htmlout += '<b>' + text + '</b><br>';
    htmlout += '<img id="' + eleImgID + '" style="width:' + myengine.canvas.width * 2 / 3 + 'px;height:' + myengine.canvas.height * 2 / 3 + 'px"></img>';
    // + '<label id="'+eleLabelID+'" class="mb"> '+id+'</label>';
    var attachTo = '#galleryarea';
    if (attachID) attachTo = '#' + attachID;
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-12')
      .html(htmlout).css({}).appendTo(attachTo);

    var img:HTMLImageElement = <HTMLImageElement>document.getElementById(eleImgID); // Use the created element
    img.src = b64img;
  };

  var checkFnSS:number; //store steady state check
  
  /**
   * show the state to be used as state 0
   * @param sid
   */
  $scope.showState = function (sid:string) {
    $state.transitionTo('app.gensimpexp', {sid: sid}, {notify: false});
    $rootScope.dataloaded = false;
    $scope.enableImpSave = false;
    $scope.isExp = true;
    //we must get the state for this sid
    $scope.$meteorSubscribe("genexps", sid).then(
      function (sub) {
        var myframe:iGenExps = GenExps.findOne({_id: sid});
        if (!myframe) return toaster.pop('warn', 'Invalid State ID');
        //update the meta
        $scope.curState.clear();
        $scope.curState.copy(myframe);
        $scope.utterance = $scope.curState.utterance.join(' ').toUpperCase();
        myengine.createObjects($scope.curState.block_meta.blocks);
        showFrame({block_state: myframe.block_state});
        $rootScope.dataloaded = true;
      }
    )
  };
  
  $scope.remState = function (sid:string) {
    if (sid){
      genexps.remove(sid);
      updateAvailExp();
      toaster.pop('warning', 'Removed ' + sid);
    }
  };

  var getStackCubes = function (mycube:miGen3DEngine.iCubeState, used:miGen3DEngine.iCubeState[], cid:number, checkY:boolean):miGen3DEngine.iCubeState[] {
    var retStack:miGen3DEngine.iCubeState[] = [];
    for (var i = 0; i < used.length; i++) {
      if (!cid || cid != used[i].prop.cid) {
        var c = used[i];
        if (myengine.intersectsMeshXYZ(mycube, c, checkY)) {
          retStack.push(c);
        }
      }
      //else console.warn('skipped', cid)
    }
    return retStack;
  };


  $scope.enableImpSave = false;
  $scope.cancelImport = function () {
    //must use function to apply to scope
    $scope.impFilename = null;
    $scope.enableImpSave = false;
    $scope.curState.clear();
    $scope.resetWorld();
  };

  $scope.saveImport = function (savename:string, isMulti?:boolean, cb?:()=>void) {
    $rootScope.dataloaded = false;

    $scope.impFilename = null;
    $scope.enableImpSave = false;
    $scope.curState.name = savename;
    setTimeout(function () {
      genexps.save($scope.curState).then(function (val) {
        if(!isMulti){
          $scope.curState._id = val[0]._id;
          $rootScope.dataloaded = true;
          updateAvailExp();
          $state.go('app.gensimpexp', {sid: val[0]._id}, {reload:true, notify: true});
        }
        if(cb) cb();
        //$state.transitionTo('app.gensimpexp', {sid: val[0]._id}, {notify: false});
      }, function (err) {
        console.warn(err);
      });
    }, 400);
  };

  $scope.clearMeta = function () {
    $('#galleryarea').empty();
    $scope.curState.clear();
    $state.transitionTo('app.gensimpexp', {}, {notify: false});
  };
  
  $scope.stateFileChanged = function (event) {
    $scope.$apply(function () {
      $scope.statefilename = event.target.files;
    });
    console.warn($scope.statefilename);
  };

  var setDecorVal = function (decor) {
    if (decor) {
      $scope.$apply(function () {
        //set switches
        switch (decor) {
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
  }

  $scope.loadStates = function () {
    if ($scope.statesfilename && $scope.statesfilename.length) {
      if ($scope.statesfilename.length > 1) {//multi file
        var reader = new FileReader();

        var procFiles = function(idx:number, files:Blob[], cb:()=>void) {
          if(_.isUndefined(files[idx])) return cb();
          reader.onload = function () {
            var filedata:miGen3DEngine.iBlockImport = JSON.parse(reader.result);
            var validKeys:string[] = ['block_meta', 'block_state', 'name', 'utterance'];
            var resValidKeys:iRetValue = apputils.isValidKeys(filedata, validKeys);
            if (resValidKeys.ret && filedata.block_state.length
              && filedata.block_meta.blocks && filedata.block_meta.blocks.length
            ) {
              if (filedata.block_meta.blocks.length != filedata.block_state.length) return $scope.$apply(function () {
                toaster.pop('error', 'Block META and STATE mismatch! '+files[idx]);
                procFiles(idx+1, files, cb);
              });
              $scope.curState.clear();
              $scope.curState.block_meta = filedata.block_meta;
              $scope.curState.public = true;
              $scope.curState.created = (new Date).getTime();
              $scope.curState.creator = $rootScope.currentUser._id;
              $scope.curState.utterance = filedata.utterance;
              $scope.utterance = filedata.utterance.join(' ').toUpperCase()['trunc'](48, true);
              setDecorVal(filedata.block_meta.decoration);
              $scope.curState.block_state = mungeBlockState(filedata.block_state);
              var savename:string = files[idx]['name'].toLowerCase().replace(/\.json/g, '');
              $scope.saveImport(savename, true, function(){
                toaster.pop('info','Saved '+savename);
                procFiles(idx+1, files, cb);
              });
            }
            else $scope.$apply(function () {
              toaster.pop('warn', 'Invalid JSON '+files[idx], JSON.stringify(resValidKeys.err));
              procFiles(idx+1, files, cb);
            });
          };
          reader.readAsText(files[idx]);
        };
        
        procFiles(0, $scope.statesfilename, function(){
          $rootScope.dataloaded = true;
          $scope.curState.clear();
          updateAvailExp();
          $state.go('app.gensimpexp', {}, {reload:true, notify: true});
        })
      }
      else {
        $scope.isExp = false;
        //read file
        var reader = new FileReader();
        reader.onload = function () {
          var filedata:miGen3DEngine.iBlockImport = JSON.parse(reader.result);
          var validKeys:string[] = ['block_meta', 'block_state', 'name', 'utterance'];
          var resValidKeys:iRetValue = apputils.isValidKeys(filedata, validKeys);
          if (resValidKeys.ret && filedata.block_state.length
            && filedata.block_meta.blocks && filedata.block_meta.blocks.length
          ) {
            if (filedata.block_meta.blocks.length != filedata.block_state.length) return $scope.$apply(function () {
              toaster.pop('error', 'Block META and STATE mismatch!');
            });
            $scope.curState.clear();
            $scope.curState.block_meta = filedata.block_meta;
            $scope.curState.public = true;
            $scope.curState.created = (new Date).getTime();
            $scope.curState.creator = $rootScope.currentUser._id;
            $scope.curState.utterance = filedata.utterance;
            $scope.utterance = filedata.utterance.join(' ').toUpperCase()['trunc'](48, true);
            setDecorVal(filedata.block_meta.decoration);
            myengine.createObjects($scope.curState.block_meta.blocks);
            //mung block_states
            $scope.curState.block_state = mungeBlockState(filedata.block_state);
            $scope.$apply(function () {
              $scope.impFilename = null;
              $scope.enableImpSave = false;
              $scope.isgen = true;
            });

            showFrame({block_state: $scope.curState.block_state}, function () {
              //wait for steady state
              checkFnSS = setInterval(function () {
                if (myengine.isSteadyState) {
                  clearInterval(checkFnSS);
                  $scope.$apply(function () {
                    if (filedata.name) $scope.impFilename = filedata.name;
                    else $scope.impFilename = $scope.statesfilename[0].name.toLowerCase().replace(/\.json/g, '');
                    $scope.enableImpSave = true;
                    $scope.isgen = false;
                  });
                }
              }, 100);
            });
          }
          else $scope.$apply(function () {
            toaster.pop('warn', 'Invalid JSON STATE file', JSON.stringify(resValidKeys.err))
          });
        };
        reader.readAsText($scope.statesfilename[0]);
      }
    }
  };

  $scope.statesFileChanged = function (event) {
    $scope.$apply(function () {
      $scope.statesfilename = event.target.files;
    });
    console.warn($scope.statesfilename);
  };

  var mungeBlockStates = function (bss:miGen3DEngine.iBlockStatesSerial[]):iBlockStates[] {
    var newbss:iBlockStates[] = [];
    for (var i = 0; i < bss.length; i++) {
      newbss.push({block_state: mungeBlockState(bss[i].block_state)});
    }
    return newbss;
  };


  /**
   * Transform text block state from cwic to internal block states
   * @param bs
   * @returns {Array}
   */
  var mungeBlockState = function (bs:miGen3DEngine.iBlockStateSerial[]):iBlockState[] {
    var newBS:iBlockState[] = [];
    bs.forEach(function (b) {
      var li:string[] = b.position.split(',');
      var lv:number[] = [];
      li.forEach(function (v, i) {
        lv.push(Number(v))
      });
      if (b.rotation) {
        var ri:string[] = b.rotation.split(',');
        var rv:number[] = [];
        ri.forEach(function (v, i) {
          rv.push(Number(v))
        });
        newBS.push({
          id: b.id, position: {
            x: lv[0], y: lv[1], z: lv[2]
          }, rotation: {
            x: rv[0], y: rv[1], z: rv[2], w: rv[3]
          }
        })
      }
      else
        newBS.push({
          id: b.id, position: {
            x: lv[0], y: lv[1], z: lv[2]
          }
        })

    });
    return newBS;
  };

  $scope.startMove = function (itr:number) {
    console.warn(itr);
    itr = Number(itr);
    $scope.isgen = true;

    var params:miGen3DEngine.iMoveItr = {itr: itr, startMove: $scope.startMove, cubesused: null};
    $scope.genStateN(params);
  };

  var nextItr = function (params:miGen3DEngine.iMoveItr) {
    return function (err, savedsid) {
      if (err) toaster.pop('warn', err);
      if (savedsid) {
        if (params.itr > 1) {
          //if(params.startGen) params.startGen(params.itr - 1);
          if (params.startMove) params.startMove(params.itr - 1);
        }
        else {
          $scope.curitr = 0;
          $scope.curcnt = 0;
          $scope.isgen = false;
        }
      }
      else {
        //don't iterate since we had error with previous insert
        //which means we need to make a new init state
        //if(params.startGen) params.startGen(params.itr);
        if (params.startMove) params.startMove(params.itr);
      }
    };
  };
  
  $scope.dlScene = function (notes:string) {
    var tempframe = {
      /*_id: $scope.curState._id,
      public: $scope.curState.public, 
      created: $scope.curState.created,
      creator: $scope.curState.creator,*/
      start_id: $scope.curState._id,
      name: $scope.curState.name,
      block_meta: null, 
      block_state: null, 
      utterance: $scope.curState.utterance,
      notes: notes
    };

    var block_state:iBlockState[] = $scope.curState.block_state;
    var newblock_state:miGen3DEngine.iBlockStateSerial[] = [];
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
      return false;
    }

    for (var i = 0; i < frame.length; i++) {
      var s = frame[i];
      var pos = '', rot = '';
      _.each(s.position, function (v) {
        if (pos.length) pos += ',';
        pos += v;
      });
      _.each(s.rotation, function (v) {
        if (rot.length) rot += ',';
        rot += v;
      });
      if(rot.length) newblock_state.push({id: s.id, position: pos, rotation: rot})
      else newblock_state.push({id: s.id, position: pos});
    }

    tempframe.block_state = newblock_state;
    tempframe.block_meta = meta;
    var content:string = JSON.stringify(tempframe, null, 2);
    var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content);
    apputils.saveAs(uriContent, 'bw_scene_' + $scope.curState._id + '.json');
  };

  // Start by calling the createScene function that you just finished creating
  var myengine:miGen3DEngine.cUI3DEngine = new mGen3DEngine.cUI3DEngine(APP_CONST.fieldsize);

  $scope.opt = myengine.opt;
  $scope.opt.limStack = true; //we add a stack limit to 3d engine vars
  console.warn(myengine.opt);
  $scope.isExp = true; //all work is consider experiment view unless we import a state
  myengine.createWorld();
  dataReady.update('world created');
}]);