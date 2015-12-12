/**========================================================
 * Module: gen-world-view.ts
 * Created by wjwong on 9/9/15.
 =========================================================*/
/// <reference path="gen-3d-engine.ts" />
/// <reference path="../../../../../model/genstatesdb.ts" />
/// <reference path="../../../../../model/screencapdb.ts" />
/// <reference path="../../../../../server/typings/lodash/lodash.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/lz-string/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../services/apputils.ts" />

angular.module('app.generate').controller('genWorldCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', 'ngDialog', 'toaster', 'APP_CONST', 'ngTableParams', 'AppUtils', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, ngDialog, toaster, APP_CONST, ngTableParams, apputils){
    "use strict";

    var mult:number = 100; //position multiplier for int random
    
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
      if($stateParams.sid){
        $scope.showState($stateParams.sid);
      }
      else $rootScope.dataloaded = true;
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
    
    /**
     * Check for cube overlap and increase height based on in order cube creation so updates to mycube y is correct
     * @param mycube - current cube
     * @param used - list of cubes already created in fifo order
     * @param idxdata - index associative array to get prev cube positions
     */
    var updateYCube = function(mycube:miGen3DEngine.iCubeState, used:number[], idxdata:miGen3DEngine.iCubeStateAsc){
      var myArr = [];
      used.forEach(function(c){myArr.push(c);});
      for(var i = 0; i < myArr.length; i++){
        var c = idxdata[myArr[i]];
        if(myengine.intersectsMeshXYZ(mycube, c, true)){
          //console.warn('intersect', mycube.prop.cid, mycube.position, c.prop.cid, c.position);
          //half of the size of the cube is from base cube other half from current cube
          mycube.position.y = c.position.y + c.prop.size/2 + mycube.prop.size/2; 
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
    var genCubeNear = function(size:number, used:number[], idxdata:miGen3DEngine.iCubeStateAsc):miGen3DEngine.iCubeMove{
      if(used.length){
        var myArr:number[] = used; //its an array
        var halfsize:number = size/2;
        var halfrad:number = APP_CONST.fieldsize/4; //near radius
        var anchorIdx:number = myArr[apputils.rndInt(0, myArr.length-1)];
        var aPos:BABYLON.Vector3 = idxdata[anchorIdx].position;
        var fieldmin:number = -(APP_CONST.fieldsize/2) + (size/2);
        var fieldmax:number = (APP_CONST.fieldsize/2) - (size/2);
        var min:number = -halfrad + halfsize;
        var max:number = halfrad - halfsize;
        var val:number = APP_CONST.fieldsize;
        var it:number = 0;
        while(val > fieldmax || val < fieldmin){
          val = apputils.rndInt(min*mult, max*mult)/mult + aPos.x;
          if(it > 50){console.warn('it > 50 posx:', val);};
        }
        var xval:number = val;
        val = APP_CONST.fieldsize;
        it = 0;
        while(val > fieldmax || val < fieldmin){
          val = apputils.rndInt(min*mult, max*mult)/mult + aPos.z;
          if(it > 50){console.warn('it > 50 posz:', val);};
        }
        var zval:number = val;
        return {anchorCid: anchorIdx, position: new BABYLON.Vector3(xval, halfsize, zval)};
      }
      console.error('no existing cubes found');
      return null
    };

    var genCubeFar = function(size, used:number[], idxdata:miGen3DEngine.iCubeStateAsc):miGen3DEngine.iCubeMove{
      if(used.length){
        var myArr:number[] = used; //its an array
        var halfsize:number = size/2;
        var halfrad:number = APP_CONST.fieldsize/4; //avoid radius
        var anchorIdx:number = myArr[apputils.rndInt(0, myArr.length-1)];
        var aPos:BABYLON.Vector3= idxdata[anchorIdx].position;
        var fieldmin:number = -(APP_CONST.fieldsize/2) + (size/2);
        var fieldmax:number = (APP_CONST.fieldsize/2) - (size/2);
        var min:number = -halfrad + halfsize;
        var max:number = halfrad - halfsize;
        var val:{x:number, z:number} = {x: APP_CONST.fieldsize, z: APP_CONST.fieldsize};
        var it:number = 0;
        while(val.x > fieldmax || val.x < fieldmin ||
          val.z > fieldmax || val.z < fieldmin ||
          (val.x > aPos.x+min && val.x < aPos.x+max 
          && val.z > aPos.z+min && val.z < aPos.z+max)){
          val.x = apputils.rndInt(fieldmin*mult, fieldmax*mult)/mult;
          val.z = apputils.rndInt(fieldmin*mult, fieldmax*mult)/mult;
          it++;
          if(it > 50) console.warn('it > 50 pos:', val);
        }
        return {anchorCid: anchorIdx, position: new BABYLON.Vector3(val.x, halfsize, val.z)};
      }
      console.error('no existing cubes found');
      return null
    };

    /**
     * Generate stack of the anchor cube on top of the base cube
     * @param size
     * @param used
     * @param idxdata
     * @returns {*}
     */
    var genCubeStack = function(size, used:number[], idxdata:miGen3DEngine.iCubeStateAsc):miGen3DEngine.iCubeMove{
      if(used.length){
        var myArr:number[] = used; //its an array
        var aidx:number = apputils.rndInt(0, myArr.length-1); //cube to move
        var anchorIdx:number = myArr[aidx];
        var halfsize:number = idxdata[anchorIdx].prop.size/2;
        var aPos:BABYLON.Vector3 = idxdata[anchorIdx].position;
        //console.warn('genCubeStack', anchorIdx, aPos);
        return {anchorCid: anchorIdx, position: new BABYLON.Vector3(aPos.x, halfsize, aPos.z)};
      }
      console.error('no existing cubes found');
      return null
    };
    
    //todo: this is not used
    var genCubeState0 = function(used:number[], idxdata:miGen3DEngine.iCubeStateAsc):miGen3DEngine.iCubeState{
      var cid:number = null;
      while(cid === null || _.indexOf(used, cid) > -1){
        cid = Number(myengine.cubesid[apputils.rndInt(0,myengine.cubesid.length-1)]);
      }
      var max:number = APP_CONST.fieldsize/2 + 0.001; //give it a little wiggle room
      var min:number = -max;
      var data:miGen3DEngine.iCubeState = {
        prop: {
          size: myengine.cubesdata[cid].meta.shape.shape_params.side_length, 
          cid: cid
        }, 
        position: null
      };
      var isRegen:boolean = true;
      while(isRegen){
        if(used.length){
          var ltype:number = apputils.rndInt(0, 9);
          if(ltype < 5){
            //console.warn('state0 near');
            var cubeDat:miGen3DEngine.iCubeMove = genCubeNear(data.prop.size, used, idxdata);
            if(cubeDat) data.position = cubeDat.position;
          }
          else{
            //console.warn('state0 far');
            var cubeDat:miGen3DEngine.iCubeMove = genCubeFar(data.prop.size, used, idxdata);
            if(cubeDat) data.position = cubeDat.position;
          }
          if(cubeDat && cubeDat.position) data.position = cubeDat.position
          else $scope.$apply(function(){
            toaster.pop('error', 'missing position')
          })
        }
        else{
          var minloc:number = (-(APP_CONST.fieldsize / 2) + (data.prop.size / 2))*mult;
          var maxloc:number = ((APP_CONST.fieldsize / 2) - (data.prop.size / 2))*mult;
          data.position = new BABYLON.Vector3(apputils.rndInt(minloc, maxloc)/mult, (data.prop.size / 2), apputils.rndInt(minloc, maxloc)/mult);
        }
        if((data.position.x - data.prop.size / 2) >= min && (data.position.x + data.prop.size / 2) <= max &&
          (data.position.z - data.prop.size / 2) >= min && (data.position.z + data.prop.size / 2) <= max){
          var cubespos:miGen3DEngine.iCubeState[] = [];
          _.each(idxdata, function(i){
            cubespos.push(i);
          })
          var anchorStack:miGen3DEngine.iCubeState[] = getStackCubes(data, cubespos, null, false);
          console.warn('output', cid, anchorStack.length);
          if(anchorStack.length < 2) isRegen = false;
        }
      }
      updateYCube(data, used, idxdata);
      used.push(cid);
      idxdata[cid] = data;
      console.warn('genCubeState0', cid, data);
      return data;
    };

    /**
     * Append moves to end of the states list
     * @param params
     */
    $scope.genStateN = function(params:miGen3DEngine.iMoveItr){
      console.warn('genStateN', params);
      //we must get the state for this params.sid
      if($scope.curState._id){
        var myframe:iGenStates = $scope.curState;
        //if(!params.cstate) //show when we use 'show state' input
        //create a munge of cube position rotate and props
        var used:miGen3DEngine.iCubeState[] = [];
        var cidlist:number[] = [];
        var cubeInWorld:miGen3DEngine.iCubeStateAsc = {};
        var cubesused:number[] = [];
        //create updated blockmeta
        var cubemeta:miGen3DEngine.iCubeMetaAsc = {};
        var maxsize:number = 0;
        _.each(myframe.block_meta.blocks, function(m:iBlockMetaEle){
          cubemeta[m.id] = m;
        });
        var cstate:number = myframe.block_states.length;
        var block_state:{id:number, position: iPosRot, rotation: iPosRot}[] = [];
        var orig = myframe.block_states[cstate-1].block_state;
        for(var i = 0; i < orig.length; i++){
          var pos:iPosRot = <iPosRot>_.extend({}, orig[i].position);
          var rot:iPosRot = <iPosRot>_.extend({}, orig[i].rotation);
          block_state.push({id: orig[i].id, position: pos, rotation: rot});
        }
        _.each(block_state, function(p, i){
          var size = cubemeta[p.id].shape.shape_params.side_length;
          if(maxsize < size) maxsize = size;
          var val:miGen3DEngine.iCubeState = {prop: {cid: p.id, size: size}, position: <any>p.position, rotation: <any>p.rotation};
          used.push(val);
          cubeInWorld[p.id] = val;
          cidlist.push(p.id);
          cubesused.push(p.id);
        });
        cubesused = _.uniq(cubesused);
        var isRegen:boolean = true;
        var cubeDat:miGen3DEngine.iCubeMove, acube:miGen3DEngine.iCubeState, cubeStack:miGen3DEngine.iCubeState[];
        while(isRegen){
          //let gencube choose a cube and create a position based on it
          var ltype:number = apputils.rndInt(0, 19);
          if(cidlist.length < 2){//only 1 cube so no stacks
            ltype = apputils.rndInt(0, 9);
          }
          if(ltype < 10){
            if(ltype < 5){
              cubeDat = genCubeNear(maxsize, cidlist, cubeInWorld);
            }
            else{
              cubeDat = genCubeFar(maxsize, cidlist, cubeInWorld);
            }
          }
          else{
            cubeDat = genCubeStack(maxsize, cidlist, cubeInWorld);
          }
          //now we randomly choose a cube outside of the anchor cube id to move to the new position
          var mycid:number = cubeDat.anchorCid;
          while(mycid == cubeDat.anchorCid && block_state.length > 1){//choose a cube not the anchor cube
            mycid = block_state[apputils.rndInt(0, block_state.length - 1)].id;
          }
          acube = cubeInWorld[mycid];
          //check Y because we will move this stack
          cubeStack = getStackCubes(acube, used, mycid, true);
          //check stack for more than stack of 2 - meaning no stacking on top of stacks or move stacks on another
          var anchorStack:miGen3DEngine.iCubeState[];
          console.warn('$scope.opt.limStack', $scope.opt.limStack);
          if($scope.opt.limStack){ //check for stacking above two
            if(!cubeStack.length){
              //don't check Y because this is the base stack where things will move to
              //we also don't need to reference cube but by position
              anchorStack = getStackCubes({position: cubeDat.position, prop: {size: maxsize}}, used, null, false);
              if(anchorStack.length < 2) isRegen = false;
              console.warn('gen itr', $scope.curState.block_states.length, mycid, cubeStack.length, cubeDat.anchorCid, anchorStack.length);
            }
          }
          else isRegen = false;
        }
        //remove cubes used from the world and leave world cubes in cidlist
        cidlist.splice(_.indexOf(cidlist, acube.prop.cid), 1);
        cubeStack.forEach(function(c){
          cidlist.splice(_.indexOf(cidlist, c.prop.cid), 1)
        });

        var basePos:{x:number, y:number, z:number} = {x: acube.position.x, y: acube.position.y, z: acube.position.z}; //store base Y
        acube.position = cubeDat.position;
        acube.position.y = acube.prop.size / 2; //translate it down to the ground
        /*acube.position.x = 0;
         acube.position.z = 0;*/
        updateYCube(acube, cidlist, cubeInWorld);
        var delta:{x:number, y:number, z:number} = {x: acube.position.x - basePos.x, y: acube.position.y - basePos.y, z: acube.position.z - basePos.z};
        cubeStack.forEach(function(c){
          c.position.x += delta.x;
          c.position.y += delta.y;
          c.position.z += delta.z;
        });
        //rebuild frame and show
        for(var i = 0; i < block_state.length; i++){
          block_state[i].position = <any>cubeInWorld[block_state[i].id].position;
        }
        showFrame({block_state: block_state}, function(){
          if(params.itr){
            //this is a iterate state generation so lets save the info
            $scope.curcnt = params.itr + 1;
            $scope.curitr = cstate + 1;
            params.cubesused = cubesused;
            setTimeout(function(){
              waitForSSAndSave(params, nextItr(params));
            }, 400);
          }
          else $scope.$apply(function(){
            toaster.pop('info', 'Generated Test Move')
          });
        });
      }
      else $scope.$apply(function(){toaster.pop('error','Missing State ID')})
    };

    /*$scope.showInitFrame = function(state:miGen3DEngine.iCubeState[], cb:()=>void){
      $scope.resetWorld();
      console.warn('showInitFrame', state);
      setTimeout(function(){
        state.forEach(function(s){
          var c = get3DCubeById(s.prop.cid);
          c.position = new BABYLON.Vector3(s.position.x, s.position.y, s.position.z);
          c.isVisible = true;
          if(hasPhysics) c.setPhysicsState({
            impostor: BABYLON.PhysicsEngine.BoxImpostor,
            move: true,
            mass: 5, //c.boxsize,
            friction: fric,
            restitution: rest
          });
        })
        if(cb) cb();
      }, 100);
    };*/

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

    /*var findBy = function(type:string, key:string, collection:any){
      return _.find(collection, function(a){return key === a[type]});
    };*/

    var insertGen = function(used, cb:(err?:any, savesid?:string)=>void){
      /*var str = '';
      used.forEach(function(cid){
        var c = get3DCubeById(cid);
        str += cid + ':' + c.position.x + ':' + c.position.y + ':' + c.position.z+'\n';
      });
      var sig = md5.createHash(str);
      var mygstate = findBy('sig', sig, genstates);
      if(!mygstate){*/
      if(true){
        //check if we loaded states or just a frame save for an existing system
        if(!$scope.curState._id && $scope.curState.block_states && $scope.curState.block_states.length
          && $scope.curState.block_states[0].screencap){
          //if there is no id for current state, there are states in it and screencap then it must be a loadstates object
          //we have to save everything in this state and save the screen caps in another value.
          for(var i = 0; i < $scope.curState.block_states.length; i++);
          
          var saveScreen = function(idx:number, list:iBlockStates, cb:(err?:any, savesid?:string)=>void){
            if(_.isUndefined(list[idx])) return cb();
            screencaps.save({
              data: list[idx].screencap,
              created: (new Date).getTime(),
              public: true
            }).then(function(val){
                delete list[idx].screencap;
                list[idx].screencapid = val[0]._id;
                saveScreen(idx+1, list, cb);
              }, function(err){
                console.warn('saveScreen', err.reason);
                cb(err);
              }
            );
          }
          
          saveScreen(0, $scope.curState.block_states, function(err:any){
            if(err) return $scope.$apply(function(){toaster.pop('error', err.reason)});
            genstates.save($scope.curState).then(function(val){
              $scope.curState._id = val[0]._id;
              cb(null, $scope.curState._id);
            }, function(err){
              cb(err.reason);
            });
          })
        }
        else{
          var max:number = APP_CONST.fieldsize / 2 + 0.001; //give it a little wiggle room
          var min:number = -max;
          var frame:iBlockState[] = [];
          var meta:iBlockMeta = {blocks: []};
          var isValid:boolean = true;
          used.forEach(function(cid){
            var c = myengine.get3DCubeById(cid);
            if(c){
              if((c.position.x - c.boxsize / 2) >= min && (c.position.x + c.boxsize / 2) <= max &&
                (c.position.z - c.boxsize / 2) >= min && (c.position.z + c.boxsize / 2) <= max){
                var dat:iBlockState = {id: cid, position: <any>c.position.clone(), rotation: <any>c.rotationQuaternion.clone()};
                frame.push(dat);
                meta.blocks.push(myengine.cubesdata[cid].meta);
              }
              else{
                isValid = false;
                //console.warn('Out',c.position.x- c.boxsize/2, c.position.x+ c.boxsize/2,c.position.z- c.boxsize/2, c.position.z+ c.boxsize/2);
              }
            }
          });
          if(!isValid){
            cb('Cube(s) Out of Bounds!');
            return false;
          }
          BABYLON.Tools.CreateScreenshot(myengine.engine, myengine.camera, {width: myengine.canvas.width, height: myengine.canvas.height}, function(b64i: string){
            var b64img:string = LZString.compressToUTF16(b64i);
            screencaps.save({
              data: b64img,
              created: (new Date).getTime(),
              public: true
            }).then(function(val){
                if(!$scope.curState.block_states) $scope.curState.block_states = [];
                $scope.curState.block_states.push({
                  block_state: frame,
                  screencapid: val[0]._id,
                  created: (new Date).getTime()
                });
                genstates.save($scope.curState).then(function(val){
                  console.warn(val[0]);
                  $scope.curState._id = val[0]._id;
                  var attachid:string = createButtons('stateimg', $scope.curState.block_states.length - 1);
                  showImage(b64img, 'Move #: ' + ($scope.curState.block_states.length - 1), attachid);
                  cb(null, $scope.curState._id);
                }, function(err){
                  cb(err.reason);
                });
              }, function(err){
                cb(err.reason);
              }
            );
          });
        }
      }
      else{
        cb('State already exists!');
      }
    };
    
    var showImage = function(b64i:string, text:string, attachID:string){
      var b64img:string = LZString.decompressFromUTF16(b64i);

      var eleDivID:string = 'div' + $('div').length; // Unique ID
      var eleImgID:string = 'img' + $('img').length; // Unique ID
      //var eleLabelID:string = 'h4' + $('h4').length; // Unique ID
      var htmlout:string = '';
      if(text) htmlout += '<b>'+text+'</b><br>';
      htmlout += '<img id="'+eleImgID+'" style="width:'+myengine.canvas.width*2/3+'px;height:'+myengine.canvas.height*2/3+'px"></img>';
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

    var checkFnSS:number; //store steady state check
    /**
     * check for a scene steady state before saving data.
     * providing a cb will short circuit checks for startgen or startmove functions
     * @param params
     */
    var waitForSSAndSave = function(params:miGen3DEngine.iMoveItr, cb:(err:any, savedsid:string)=>void){
      checkFnSS = setInterval(function(){
        if(myengine.isSteadyState){
          clearInterval(checkFnSS);
          insertGen(params.cubesused, cb);
        }
      }, 200);
    };
    
    /**
     * start generation of cubes based on number of buces, iterations, and layout type
     * 
     * @param ccnt
     * @param itr
     * @param cstate
     */
    $scope.startGen = function(){
      var state:iBlockState[] = [];
      var cubeidxdata:miGen3DEngine.iCubeStateAsc = {};
      var cubesused:number[] = [];
      var myccnt:number = $scope.curState.block_meta.blocks.length;
      for(var i = 0; i < myccnt; i++){
        var dat = genCubeState0(cubesused, cubeidxdata); //save used list
        state.push({id: dat.prop.cid, position: <any>dat.position});
      }
      if(cubesused.length != state.length)
        console.warn('done state!!', cubesused.length, state.length);

      $('#galleryarea').empty();
      myengine.createObjects($scope.curState.block_meta.blocks);
      $scope.curState.public = true;
      $scope.curState.created = (new Date).getTime();
      $scope.curState.creator = $rootScope.currentUser._id;
      showFrame({block_state: state}, function(){
        checkFnSS = setInterval(function(){
          if(myengine.isSteadyState){
            clearInterval(checkFnSS);
            //check if all cubes are inside the bounds of the table
            var max:number = APP_CONST.fieldsize/2 + 0.001; //give it a little wiggle room
            var min:number = -max;
            var isValid:boolean = true;
            var len:number = $scope.curState.block_meta.blocks.length;
            for(var i:number = 0; i < len; i++){
              var cid:number = $scope.curState.block_meta.blocks[i].id;
              var c:miGen3DEngine.iMeshMod = myengine.get3DCubeById(cid);
              if(c){
                if(!((c.position.x - c.boxsize / 2) >= min && (c.position.x + c.boxsize / 2) <= max &&
                  (c.position.z - c.boxsize / 2) >= min && (c.position.z + c.boxsize / 2) <= max)){
                  isValid = false; //fail time to restart the generation
                  i = len;
                }
              }
            }
            if(!isValid) $scope.startGen();
            else $scope.$apply(function(){
              $scope.impFilename = 'system';
              $scope.enableImpSave = true;
            });
          }
        }, 100);
      });

/*
      $scope.showInitFrame(state, function(){
        var params = {cubesused: cubesused, creator: 'system'};
        //we need to set a timeout before checking steading states or we get bad block layouts
        setTimeout(function(){waitForSSAndSave(params, function(err, sid){
          console.warn()
        });}, 400);
      });*/
    };

    /**
     * show the state to be used as state 0
     * @param sid
     */
    $scope.showState = function(sid:string){
      $state.transitionTo('app.genworld', {sid: sid}, {notify: false});
      $rootScope.dataloaded = false;
      $scope.enableImpSave = false;
      //we must get the state for this sid
      $scope.$meteorSubscribe("genstates", sid).then(
        function(sub){
          var myframe:iGenStates = GenStates.findOne({_id: sid});
          if(!myframe) return toaster.pop('warn', 'Invalid State ID');
          //update the meta
          $scope.curitr = myframe.block_states.length-1;
          $scope.curcnt = 0;
          $scope.curState.clear();
          $scope.curState.copy(myframe);
          myengine.createObjects($scope.curState.block_meta.blocks);
          showFrame(myframe.block_states[$scope.curitr]);
          function itrScreencap(idx, list, cb){
            if(_.isUndefined(list[idx])){
              $rootScope.dataloaded = true;
              return cb();
            }
            var scid:string = list[idx].screencapid;
            $scope.$meteorSubscribe("screencaps", scid).then(function(sub){
              var screen:iScreenCaps = ScreenCaps.findOne({_id: scid});
              var attachid:string = createButtons('stateimg', idx);
              showImage(screen.data, 'Move #:' + idx, attachid);
              itrScreencap(idx+1, list, cb);
            });
          }
          itrScreencap(0, myframe.block_states, function(){});
        }
      )
    };
    
    var createButtons = function(id:string, i:number):string{
      var lenID:number = $('div').length;
      var eleDivID:string = 'rowdiv' + lenID; // Unique ID
      var retId:string = id+lenID;
      var htmlout:string =
        '<button onclick="angular.element(this).scope().cloneMove('+i+')" class="btn btn-xs btn-info"> Clone Move </button>'+
        '    '+
        '<button onclick="angular.element(this).scope().getMove('+i+')" class="btn btn-xs btn-info"> Get JSON </button>'+
        '    '+
        '<button onclick="angular.element(this).scope().delMove('+i+')" class="btn btn-xs btn-info"> Delete Move(s) </button>'+
        '<div id="'+retId+'"></div>';
      var attachTo:string = '#galleryarea';
      $('<div>').attr({
        id: eleDivID
      }).addClass('col-sm-4')
        .html(htmlout).css({"border-bottom": '1px solid #e4eaec'}).appendTo(attachTo);
      return retId;
    };

    $scope.remState = function(sid:string){
      if(sid){
        $scope.$meteorSubscribe("genstates", sid).then(
          function(sub){
            var myframe:iGenStates = GenStates.findOne({_id: sid});
            myframe.block_states.forEach(function(s){
              screencaps.remove(s.screencapid);
            })
            genstates.remove(sid);
            updateTableStateParams();
            toaster.pop('warning', 'Removed ' + sid);
          }
        );
      }
    };

    var getStackCubes = function(mycube:miGen3DEngine.iCubeState, used:miGen3DEngine.iCubeState[], cid:number, checkY:boolean):miGen3DEngine.iCubeState[]{
      var retStack:miGen3DEngine.iCubeState[] = [];
      for(var i = 0; i < used.length; i++){
        if(!cid || cid != used[i].prop.cid){
          var c = used[i];
          if(myengine.intersectsMeshXYZ(mycube, c, checkY)){
            retStack.push(c);
          }
        }
        //else console.warn('skipped', cid)
      }
      return retStack;
    };
    
    /*$scope.myreplay = null;
    $scope.frameid = -1;
    var showReplay = function(idx){
      var frameScene = $scope.myreplay.data.act[idx];
      frameScene.forEach(function(frame){
        var cube = cubesnamed[frame.name];
        cube.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
        cube.rotationQuaternion = new BABYLON.Quaternion(frame.rotation.x, frame.rotation.y, frame.rotation.z, frame.rotation.w);
        cube.isVisible = true;
      })
    };*/

    $scope.enableImpSave = false;
    $scope.cancelImport = function(){
      //must use function to apply to scope
      $scope.impFilename = null;
      $scope.enableImpSave = false;
      $scope.curState.clear();
      $scope.resetWorld();
    };

    $scope.saveImport = function(savename:string){
      $rootScope.dataloaded = false;

      $scope.impFilename = null;
      $scope.enableImpSave = false;
      var cubesused:number[] = [];
      $scope.curState.block_meta.blocks.forEach(function(b){
        cubesused.push(b.id);
      });
      cubesused = _.uniq(cubesused);
      if(!$scope.curState.block_meta.decoration){
        //set decoration if we don't have one
        if(!$scope.opt.showImages) $scope.curState.block_meta.decoration = cBlockDecor.blank;
        else{
          if($scope.opt.showLogos) $scope.curState.block_meta.decoration = cBlockDecor.logo;
          else $scope.curState.block_meta.decoration = cBlockDecor.digit;
        }
      }
      $scope.curState.name = savename;
      console.warn('saveImport');
      var params:miGen3DEngine.iMoveItr = {itr: 0, startMove: null, cubesused: cubesused};
      setTimeout(function(){waitForSSAndSave(params, 
        function(err:any, savedsid:string){
          console.warn('saveimport wait for');
          if(err) toaster.pop('warn', err);
          if(savedsid){
            $scope.curitr = $scope.curState.stateitr;
            $scope.curcnt = 0;
            updateTableStateParams();
            $state.transitionTo('app.genworld', {sid: savedsid}, {notify: false});
          }
          $rootScope.dataloaded = true;
        });
      }, 400);
    };

    $scope.clearMeta = function(){
      $('#galleryarea').empty();
      $scope.curState.clear();
      $state.transitionTo('app.genworld', {}, {notify: false});
    };

    $scope.loadMeta = function(){
      if($scope.metafilename && $scope.metafilename.length){
        //read file
        var reader = new FileReader();
        reader.onload = function(){
          var filedata:iBlockMeta = JSON.parse(reader.result);
          if(filedata.blocks && filedata.blocks.length){
            $scope.$apply(function(){
              $scope.curState.clear();
              $scope.curState.block_meta = filedata;
              myengine.createObjects($scope.curState.block_meta.blocks);
            })
          }
          else $scope.$apply(function(){toaster.pop('warn', 'Invalid JSON META file')});
        };
        reader.readAsText($scope.metafilename[0]);
      }
    };
    
    $scope.metaFileChanged = function(event){
      $scope.$apply(function(){$scope.metafilename = event.target.files;});
      console.warn($scope.metafilename);
    };
    
    /**
     * loads a json state file with the CURRENT state iteration set to 0
     */
    $scope.loadState = function(){
      if($scope.statefilename && $scope.statefilename.length){
        //read file
        var reader = new FileReader();
        reader.onload = function(){
          var filedata:miGen3DEngine.iBlockImport = JSON.parse(reader.result);
          if(filedata.block_state && filedata.block_state.length
            && filedata.block_meta && filedata.block_meta.blocks && filedata.block_meta.blocks.length){
            if(filedata.block_meta.blocks.length != filedata.block_state.length) return $scope.$apply(function(){
              toaster.pop('error', 'Block META and STATE mismatch!');
            });
            $scope.curState.clear();
            $scope.curState.block_meta = filedata.block_meta;
            $scope.curState.public = true;
            $scope.curState.created = (new Date).getTime();
            $scope.curState.creator = $rootScope.currentUser._id;
            setDecorVal(filedata.block_meta.decoration);
            
            console.warn($scope.curState.block_meta);
            myengine.createObjects($scope.curState.block_meta.blocks);
            //mung block_state
            //filedata.block_state = mungeBlockState(filedata.block_state);
            $scope.$apply(function(){
              $scope.impFilename = null;
              $scope.enableImpSave = false;
              $scope.isgen = true;
            });
            
            var block_state:iBlockState[] = mungeBlockState(filedata.block_state);
            showFrame({block_state: block_state}, function(){
              $scope.$apply(function(){
                if(filedata.name) $scope.impFilename = filedata.name;
                else $scope.impFilename = $scope.statefilename[0].name.toLowerCase().replace(/\.json/g, '');
                $scope.enableImpSave = true;
                $scope.isgen = false;
              });
            })
          }
          else $scope.$apply(function(){toaster.pop('warn', 'Invalid JSON STATE file')});
        };
        reader.readAsText($scope.statefilename[0]);
      }
    };

    $scope.stateFileChanged = function(event){
      $scope.$apply(function(){$scope.statefilename = event.target.files;});
      console.warn($scope.statefilename);
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
    }

    $scope.loadStates = function(){
      if($scope.statesfilename && $scope.statesfilename.length){
        //read file
        var reader = new FileReader();
        reader.onload = function(){
          var filedata:miGen3DEngine.iBlockImport = JSON.parse(reader.result);
          if(filedata.block_states && filedata.block_states.length
            && filedata.block_meta && filedata.block_meta.blocks && filedata.block_meta.blocks.length){
            if(filedata.block_meta.blocks.length != filedata.block_states[0].block_state.length) return $scope.$apply(function(){
              toaster.pop('error', 'Block META and STATE mismatch!');
            });
            $scope.curState.clear();
            $scope.curState.block_meta = filedata.block_meta;
            $scope.curState.public = true;
            $scope.curState.created = (new Date).getTime();
            $scope.curState.creator = $rootScope.currentUser._id;
            setDecorVal(filedata.block_meta.decoration);

            console.warn($scope.curState.block_meta);
            myengine.createObjects($scope.curState.block_meta.blocks);
            //mung block_states
            $scope.curState.block_states = mungeBlockStates(filedata.block_states);
            $scope.$apply(function(){
              $scope.impFilename = null;
              $scope.enableImpSave = false;
              $scope.isgen = true;
            });
            
            var itrFrame = function(idx:number, block_states:iBlockStates, cb:()=>void){
              if(_.isUndefined(block_states[idx])){
                $scope.$apply(function(){
                  if(filedata.name) $scope.impFilename = filedata.name;
                  else $scope.impFilename = $scope.statesfilename[0].name.toLowerCase().replace(/\.json/g, '');
                  $scope.enableImpSave = true;
                  $scope.isgen = false;
                });
                return cb();
              }
              showFrame(block_states[idx], function(){
                //wait for steady state
                checkFnSS = setInterval(function(){
                  if(myengine.isSteadyState){
                    clearInterval(checkFnSS);
                    var sc = BABYLON.Tools.CreateScreenshot(myengine.engine, myengine.camera, {
                      width: myengine.canvas.width, height: myengine.canvas.height
                    }, function(b64i: string){
                      var b64img:string = LZString.compressToUTF16(b64i);
                      /*console.warn('len', b64i.length, b64img.length);
                      console.warn('b64i', b64i);
                      console.warn('b64img', LZString.decompressFromUTF16(b64img));*/
                      block_states[idx].screencap = b64img;
                      block_states[idx].created = (new Date).getTime();
                      var attachid:string = createButtons('stateimg', idx);
                      showImage(b64img, 'Move #: ' + idx, attachid);
                      itrFrame(idx + 1, block_states, cb);
                    });
                  }
                }, 100);
              });
            }
            
            itrFrame(0, $scope.curState.block_states, function(){
              console.warn($scope.curState.block_states);
            });
          }
          else $scope.$apply(function(){toaster.pop('warn', 'Invalid JSON STATE file')});
        };
        reader.readAsText($scope.statesfilename[0]);
      }
    };

    $scope.statesFileChanged = function(event){
      $scope.$apply(function(){$scope.statesfilename = event.target.files;});
      console.warn($scope.statesfilename);
    };
    
    var mungeBlockStates = function(bss:miGen3DEngine.iBlockStatesSerial[]):iBlockStates[]{
      var newbss:iBlockStates[] = [];
      for(var i = 0; i < bss.length; i++){
        newbss.push({block_state: mungeBlockState(bss[i].block_state)});
      }
      return newbss;
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
    
    $scope.startMove = function(itr:number){
      console.warn(itr);
      itr = Number(itr);
      $scope.isgen = true;

      var params:miGen3DEngine.iMoveItr = {itr: itr, startMove: $scope.startMove, cubesused: null};
      $scope.genStateN(params);
    };

    var nextItr = function(params:miGen3DEngine.iMoveItr){
      return function(err, savedsid){
        if(err) toaster.pop('warn', err);
        if(savedsid){
          if(params.itr > 1){
            //if(params.startGen) params.startGen(params.itr - 1);
            if(params.startMove) params.startMove(params.itr - 1);
          }
          else{
            $scope.curitr = 0;
            $scope.curcnt = 0;
            $scope.isgen = false;
          }
        }
        else{
          //don't iterate since we had error with previous insert
          //which means we need to make a new init state
          //if(params.startGen) params.startGen(params.itr);
          if(params.startMove) params.startMove(params.itr);
        }
      };
    };

    $scope.cloneMove = function(idx:number){
      var prevState:iGenStates = <iGenStates>_.extend({}, $scope.curState);
      $scope.curState.clear();
      $scope.curState.block_meta = prevState.block_meta;
      $scope.curState.public = true;
      $scope.curState.created = (new Date).getTime();
      $scope.curState.creator = $rootScope.currentUser._id;

      $('#galleryarea').empty();
      myengine.createObjects($scope.curState.block_meta.blocks);
      showFrame(prevState.block_states[idx], function(){
        $scope.$apply(function(){
          if(prevState.name) $scope.impFilename = prevState.name;
          $scope.enableImpSave = true;
        });
      })
    };

    $scope.dlScene = function(){
      var tempframe = {_id: $scope.curState._id,
        public: $scope.curState.public, name: $scope.curState.name, created: $scope.curState.created,
        creator: $scope.curState.creator, block_meta: $scope.curState.block_meta, block_states: []};

      for(var idx = 0; idx < $scope.curState.block_states.length; idx++){
        var block_state:iBlockState[] = $scope.curState.block_states[idx].block_state;
        var newblock_state:miGen3DEngine.iBlockStateSerial[] = [];
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
      var content:string = JSON.stringify(tempframe, null, 2);
      var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content);
      apputils.saveAs(uriContent, 'bw_scene_'+$scope.curState._id+'.json');
    };

    $scope.getMove = function(idx:number){
      var tempframe:{block_meta: iBlockMeta, block_state:miGen3DEngine.iBlockStateSerial[]} = {block_meta: $scope.curState.block_meta, block_state: []};
      var block_state:iBlockState[] = $scope.curState.block_states[idx].block_state;
      for(var i = 0; i < block_state.length; i++){
        var s:iBlockState = block_state[i];
        var pos = '', rot = '';
        _.each(s.position, function(v){
          if(pos.length) pos += ',';
          pos += v;
        });
        _.each(s.rotation, function(v){
          if(rot.length) rot += ',';
          rot += v;
        });
        tempframe.block_state.push({id: s.id, position: pos, rotation: rot})
      }
      var content:string = JSON.stringify(tempframe, null, 2);
      var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content);
      apputils.saveAs(uriContent, 'bw_state_'+$scope.curState._id+'_'+idx+'.json');
    };

    $scope.delMove = function(idx:number){
      var count:number = $scope.curState.block_states.length-idx;
      $scope.curState.block_states.splice(idx, count);
      genstates.save($scope.curState).then(function(val){
        $scope.clearMeta();
        $scope.showState(val[0]._id);
      }, function(err){
        console.warn(err.reason);
      });
    };

    // Start by calling the createScene function that you just finished creating
    var myengine:miGen3DEngine.c3DEngine = new mGen3DEngine.c3DEngine(APP_CONST.fieldsize);

    $scope.opt = myengine.opt;
    $scope.opt.limStack = true; //we add a stack limit to 3d engine vars
    console.warn(myengine.opt);
    myengine.createWorld();
    dataReady.update('world created');
  }]);