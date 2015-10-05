/**========================================================
 * Module: gen-gallery-view.js
 * Created by wjwong on 9/14/15.
 =========================================================*/
angular.module('angle').controller('genGalleryCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', 'ngDialog', 'toaster', 'APP_CONST', 'md5', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, ngDialog, toaster, appConst, md5){
    "use strict";

    var hasPhysics = true;
    var fric = 0.1;
    var rest = 0.2;
    var showGrid = true;

    var screenshotCanvas = document.getElementById('screencap');
    var screenRaw;
    BABYLON.Tools.DumpFramebuffer = function (width, height, engine) {
      console.log("MY version of DumpFramebuffer - Activated!", screenshotCanvas);
      // Read the contents of the framebuffer
      var numberOfChannelsByLine = width * 4;
      var halfHeight = height / 2;
      //Reading datas from WebGL
      screenRaw = engine.readPixels(0, 0, width, height);
      for (var i = 0; i < halfHeight; i++) {
        for (var j = 0; j < numberOfChannelsByLine; j++) {
          var currentCell = j + i * numberOfChannelsByLine;
          var targetLine = height - i - 1;
          var targetCell = j + targetLine * numberOfChannelsByLine;
          var temp = screenRaw[currentCell];
          screenRaw[currentCell] = screenRaw[targetCell];
          screenRaw[targetCell] = temp;
        }
      }
      // Create a 2D canvas to store the result
      if (!screenshotCanvas) {
        screenshotCanvas = document.createElement('canvas');
      }
      screenshotCanvas.width = width;
      screenshotCanvas.height = height;
      var context = screenshotCanvas.getContext('2d');
      // Copy the pixels to a 2D canvas
      var imageData = context.createImageData(width, height);
      //cast is due to ts error in lib.d.ts, see here - https://github.com/Microsoft/TypeScript/issues/949
      var castData = imageData.data;
      castData.set(screenRaw);
      context.putImageData(imageData, 0, 0);
      return imageData.data;
    };

    // Get the canvas element from our HTML above
    var canvas = document.getElementById("renderCanvasBab");
    var engine;

    var cubeslist = [];
    var cubesnamed = {};
    var numcubes = 0;
    var cubecolors = ['red', 'yellow', 'cyan', 'purple', 'green', 'orange'];
    var colorids = {};
    colorids['red'] = (new BABYLON.Color3.FromInts(210,49,93));
    colorids['yellow'] = (new BABYLON.Color3.FromInts(247,200,8));
    colorids['cyan'] = (new BABYLON.Color3.FromInts(34,181,191));
    colorids['purple'] = (new BABYLON.Color3.FromInts(135,103,166));
    colorids['green'] = (new BABYLON.Color3.FromInts(136,193,52));
    colorids['orange'] = (new BABYLON.Color3.FromInts(233,136,19));
    //['#d2315d', '#f7c808', '#22b5bf', '#8767a6', '#88c134', '#e98813'];
    var cubesize = {
      s: 1,
      m: 2,
      l: 3
    };
    var camera;

    /**
     * Create cubes based on size s m l and color
     * data: size, color scene, pos (position)
     * @param data
     */
    var createCube = function(data){
      var boxsize = cubesize[data.size];
      var objname = "cube_"+ boxsize + '_' + data.color + '_' +numcubes;
      var boxcolor = colorids[data.color];
      var boxmat = new BABYLON.StandardMaterial(objname, data.scene);
      /*var boxt = new BABYLON.Texture("img/textures/wood.jpg", scene);
       boxt.uScale = boxt.vScale = 1;
       boxmat.diffuseTexture = boxt;
       boxmat.specularColor = BABYLON.Color3.Black();*/
      boxmat.diffuseColor = boxcolor;
      //boxmat.alpha = 0.8;
      var box = BABYLON.Mesh.CreateBox(objname, boxsize, data.scene);
      //box.position.y = 5;
      box.position = data.pos;
      box.visibility = 1;
      box.material = boxmat;
      box.showBoundingBox = false;
      box.checkCollisions = true;
      box.isVisible = data.isVisible;
      box.boxsize = boxsize;
      var elipbox = boxsize;
      box.ellipsoid = new BABYLON.Vector3(elipbox, elipbox, elipbox);
      //box.ellipsoidOffset = new BABYLON.Vector3(0, 0.1, 0);
      box.applyGravity = true;
      box.receiveShadows = true;
      box.rotation.y = 0; //Math.PI/4;
      /*else
       if(!box.rotationQuaternion)
       box.rotationQuaternion = new BABYLON.Quaternion.Identity(); //make a quaternion available if no physics*/

      /*if(hasPhysics)
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:boxsize, friction:0.6, restitution:0.1});*/
      box.onCollide = function(a){
        console.warn('oncollide', objname, this, a)
      };
      //box.updatePhysicsBodyPosition();
      //box.refreshBoundingInfo();
      //box.moveWithCollisions(new BABYLON.Vector3(-1, 0, 0));
      numcubes++;
      cubeslist.push(box);
      cubesnamed[objname] = box;
    };

    var isZeroVec = function(vect3){
      if(vect3.x < -0.001 || vect3.x > 0.001) return false;
      if(vect3.y < -0.001 || vect3.y > 0.001) return false;
      if(vect3.z < -0.001 || vect3.z > 0.001) return false;
      return true;
    };

    var isSteadyState;
    var oimo;
    var table;
    // This begins the creation of a function that we will 'call' just after it's built
    var createScene = function () {
      // Now create a basic Babylon Scene object
      var scene = new BABYLON.Scene(engine);
      oimo = new BABYLON.OimoJSPlugin();
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), oimo);
      // Change the scene background color to green.
      scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
      scene.collisionsEnabled = true;
      scene.workerCollisions = true;

      //  Create an ArcRotateCamera aimed at 0,0,0, with no alpha, beta or radius, so be careful.  It will look broken.
      camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 0, 0, 20, new BABYLON.Vector3(0, 4, 0), scene);
      // Quick, let's use the setPosition() method... with a common Vector3 position, to make our camera better aimed.
      camera.setPosition(new BABYLON.Vector3(0, 15, -23));
      // This creates and positions a free camera
      //camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 15, -46), scene);
      // This targets the camera to scene origin
      //camera.setTarget(new BABYLON.Vector3(0,12,0));
      // This attaches the camera to the canvas
      //camera.attachControl(canvas, true);
      /*camera.speed = 1;
       camera.ellipsoid = new BABYLON.Vector3(1, 1, 1); //bounding ellipse
       camera.checkCollisions = true;
       camera.keysUp = [87]; // w
       camera.keysDown = [83]; // s
       camera.keysLeft = [65]; //  a
       camera.keysRight = [68]; // d*/

      scene.activeCamera = camera;
      scene.activeCamera.attachControl(canvas, true);

      // This creates a light, aiming 0,1,0 - to the sky.
      var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
      // Dim the light a small amount
      light.intensity = 0.6;
      // this creates dir. light for shadows
      var dirlight = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-0.4, -2, -0.4), scene);
      // Dim the light a small amount
      dirlight.intensity = 0.6;
      dirlight.position = new BABYLON.Vector3(0, 40, 0);

      /** create origin*/
      /*var matPlan = new BABYLON.StandardMaterial("matPlan1", scene);
       matPlan.backFaceCulling = false;
       matPlan.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);
       var origin = BABYLON.Mesh.CreateSphere("origin", 4, 0.3, scene);
       origin.material = matPlan;*/

      /** SKYBOX **/
      BABYLON.Engine.ShadersRepository = "shaders/";
      var skybox = BABYLON.Mesh.CreateSphere("skyBox", 10, 2500, scene);
      var shader = new BABYLON.ShaderMaterial("gradient", scene, "gradient", {});
      shader.setFloat("offset", 0);
      shader.setFloat("exponent", 0.6);
      shader.setColor3("topColor", BABYLON.Color3.FromInts(0,119,255));
      shader.setColor3("bottomColor", BABYLON.Color3.FromInts(240,240, 255));
      shader.backFaceCulling = false;
      skybox.material = shader;

      /** GROUND **/
      // Material
      var mat = new BABYLON.StandardMaterial("ground", scene);
      mat.diffuseColor = BABYLON.Color3.FromInts(63,117,50);
      /*var t = new BABYLON.Texture("img/textures/wood.jpg", scene);
       t.uScale = t.vScale = 5;
       mat.diffuseTexture = t;
       mat.specularColor = BABYLON.Color3.Black();*/
      //var gridshader = new BABYLON.ShaderMaterial("grid", scene, "grid", {}); //shader grid

      // Object
      var ground = BABYLON.Mesh.CreateBox("ground", 300, scene);
      ground.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
      ground.position.y = -0.5;
      ground.scaling.y = 0.001;
      ground.onCollide = function(a,b){
        console.warn('oncollide ground', a, b)
      };
      ground.material = mat; //gridshader;
      if(hasPhysics)
        ground.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});
      ground.checkCollisions = true;
      ground.receiveShadows = true;

      //** table
      // Material
      var tablemat = new BABYLON.StandardMaterial("table", scene);
      var twood = new BABYLON.Texture("img/textures/plasticwhite.jpg", scene);
      twood.uScale = twood.vScale = 1;
      tablemat.diffuseTexture = twood;
      tablemat.specularColor = BABYLON.Color3.Black();
      //var gridshader = new BABYLON.ShaderMaterial("grid", scene, "grid", {}); //shader grid
      var tableboxsize = appConst.fieldsize;
      table = BABYLON.Mesh.CreateBox("table", tableboxsize, scene);
      table.boxsize = tableboxsize;
      table.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
      table.position.y = 0;
      table.scaling.y = 0.001;
      table.onCollide = function(a,b){
        console.warn('oncollide table', a, b)
      };
      table.material = tablemat; //gridshader;
      if(hasPhysics)
        table.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});
      table.checkCollisions = true;
      table.receiveShadows = true;

      var gridmat = new BABYLON.StandardMaterial("grid", scene);
      gridmat.wireframe = true; //create wireframe
      gridmat.diffuseColor = BABYLON.Color3.Gray();
      grid = BABYLON.Mesh.CreateGround("grid", appConst.fieldsize, appConst.fieldsize, 6, scene, false); //used to show grid
      grid.position.y = 0.02;
      grid.scaling.y = 0.001;
      grid.material = gridmat;

      //add cube
      cubeslist.length = 0;
      numcubes = 0;
      var p = -2;
      for(var i = 0; i < 5; i++){
        createCube({pos: new BABYLON.Vector3((p+i)*2,cubesize.s*2, 28), scene: scene, size: 's', color: cubecolors[i], isVisible: false});
      }
      for(var i = 0; i < 5; i++){
        createCube({pos: new BABYLON.Vector3((p+i)*4,cubesize.m*2, 30), scene: scene, size: 'm', color: cubecolors[i], isVisible: false});
      }
      for(var i = 0; i < 5; i++){
        createCube({pos: new BABYLON.Vector3((p+i)*4,cubesize.l, 40), scene: scene, size: 'l', color: cubecolors[i], isVisible: false});
      }

      var animate = function(){
        isSteadyState = true;
        cubeslist.forEach(function(c){
          //count the number of 0 move ticks
          if(c.oldpos){
            var delta = c.oldpos.subtract(c.position);
            if(isZeroVec(delta)){
              if(!c.zeromoveTicks) c.zeromoveTicks = 0;
              c.zeromoveTicks++;
              if(c.isMoving && c.zeromoveTicks > 20){//only reset color if it was moving
                c.material.emissiveColor = new BABYLON.Color3.Black();
                c.isMoving = false;
                c.zeromoveTicks = 0;
                c.tchecked = false;
              }
              else if(c.isMoving) isSteadyState = false;
            }
            else{
              c.material.emissiveColor = new BABYLON.Color3(0.176, 0.85, 0.76);
              c.isMoving = true;
              isSteadyState = false;
            }
          }
          c.oldpos = c.position.clone();
        });
      };

      scene.registerBeforeRender(animate);
      // Leave this function
      return scene;
    };  // End of createScene function

    var updateRender = function (scene) {
      return function(){
        scene.render();
      }
    };

    function createWorld(){
      // Load the BABYLON 3D engine
      engine = new BABYLON.Engine(canvas);
      // Now, call the createScene function that you just finished creating
      scene = createScene();
      // Register a render loop to repeatedly render the scene
      engine.runRenderLoop(updateRender(scene));
      // Watch for browser/canvas resize events
      window.addEventListener("resize", function () {
        engine.resize();
      });
    };
    
    //**start app================================
    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var cubecolors = ['red', 'yellow', 'cyan', 'purple', 'green', 'orange'];
    $scope.cubeprops = [];
    var genCubeProps = function(){
      for(var s = 1; s < 4; s++){
        for(var i = 0; i < 5; i++){
          var cid = (s-1)*5+i;
          $scope.cubeprops.push({color: i, size: s, cid: cid, name: cubeslist[cid].name});
        }
      }
    };

    var genstates = $scope.$meteorCollection(GenStates);
    $scope.$meteorSubscribe("genstates").then(
      function(sid){dataReady('genstates');},
      function(err){ console.log("error", arguments, err); }
    );

    $scope.showTime = function(){
      return (new Date).getTime();
    };

    var readydat = [];
    var dataReady = function(data){
      console.warn('ready ', data, (new Date).getTime());
      readydat.push(data);
      if(readydat.length > 1){
        $rootScope.dataloaded = true;
        $scope.statenum = _.uniq(GenStates.find({}, {
          sort: {stateid: 1}, fields: {stateid: true}
        }).fetch().map(function(x) {
          return x.stateid;
        }), true);
      }
    };

    $scope.resetWorld = function(){
      var c;
      var p = -2;
      for(var i = 0; i < 5; i++){
        c = cubeslist[i];
        if(hasPhysics) oimo.unregisterMesh(c); //stop physics
        c.position = new BABYLON.Vector3((p+i)*2,cubesize.s*2, 28);
        c.rotationQuaternion = BABYLON.Quaternion.Identity().clone();
        c.isVisible = false;
      }
      for(var i = 0; i < 5; i++){
        c = cubeslist[i+5];
        if(hasPhysics) oimo.unregisterMesh(c); //stop physics
        c.position = new BABYLON.Vector3((p+i)*4,cubesize.m*2, 30);
        c.rotationQuaternion = BABYLON.Quaternion.Identity().clone();
        c.isVisible = false;
      }
      for(var i = 0; i < 5; i++){
        c = cubeslist[i+10];
        if(hasPhysics) oimo.unregisterMesh(c); //stop physics
        c.position = new BABYLON.Vector3((p+i)*4,cubesize.l, 40);
        c.rotationQuaternion = BABYLON.Quaternion.Identity().clone();
        c.isVisible = false;
      }
      camera.setPosition(new BABYLON.Vector3(0, 15, -23));
    };

    /**
     * Overlap check for src inside tgt mesh in the x z footprint
     * @param src
     * @param tgt
     * @returns {boolean}
     */
    var intersectsMeshXYZ = function(src, tgt){
      var s = (src.prop.size/2)-0.1; //slightly small
      var a = {
        max: {x: src.position.x+s, y: src.position.y+s, z: src.position.z+s},
        min: {x: src.position.x-s, y: src.position.y-s, z: src.position.z-s}
      };
      s = (tgt.prop.size/2)-0.1;
      var b = {
        max: {x: tgt.position.x+s, y: tgt.position.y+s, z: tgt.position.z+s},
        min: {x: tgt.position.x-s, y: tgt.position.y-s, z: tgt.position.z-s}
      }

      if (a.max.x < b.min.x) return false; // a is left of b
      if (a.min.x > b.max.x) return false; // a is right of b
      if (a.max.z < b.min.z) return false; // a is front b
      if (a.min.z > b.max.z) return false; // a is back b
      if (a.min.y > b.max.y) return false; // a is top b
      return true; // boxes overlap
    };

    /**
     * Check for cube overlap and increase height based on in order cube creation so updates to mycube y is correct
     * @param mycube - current cube
     * @param used - list of cubes already created in fifo order
     * @param idxdata - index associative array to get prev cube positions
     */
    var updateYCube = function(mycube, used, idxdata){
      var myArr = [];
      used.forEach(function(c){myArr.push(c);});
      for(var i = 0; i < myArr.length; i++){
        var c = idxdata[myArr[i]];
        if(intersectsMeshXYZ(mycube, c)){
          console.warn('intersect', mycube.prop.cid, mycube.position, c.prop.cid, c.position);
          //half of the size of the cube is from base cube other half from current cube
          mycube.position.y = c.position.y + c.prop.size/2 + mycube.prop.size/2;
        }
      };
    };

    /**
     * generate cube close to anchor cube if there is none then we just generate cube via field.
     * returns null or vector3 position.
     * @param size
     * @param used
     * @param idxdata
     * @returns {*}
     */
    var genCubeNear = function(size, used, idxdata){
      if(used.size || used.length){
        var myArr = [];
        used.forEach(function(c){myArr.push(c);});
        var halfsize = size/2;
        var halfrad = 6/2; //near radius
        var anchorIdx = myArr[getRandomInt(0, myArr.length-1)];
        var aPos = idxdata[anchorIdx].position;
        var fieldmin = -(appConst.fieldsize/2) + (size/2);
        var fieldmax = (appConst.fieldsize/2) - (size/2);
        var min = -halfrad + halfsize;
        var max = halfrad - halfsize;
        var val = appConst.fieldsize;
        var it = 0;
        while(val > fieldmax || val < fieldmin){
          val = getRandomInt(min, max) + aPos.x;
          if(it > 50){console.warn('it > 50 posx:', val);};
        }
        var xval = val;
        val = appConst.fieldsize;
        it = 0;
        while(val > fieldmax || val < fieldmin){
          val = getRandomInt(min, max) + aPos.z;
          if(it > 50){console.warn('it > 50 posz:', val);};
        }
        var zval = val;
        return {anchorCid: anchorIdx, position: new BABYLON.Vector3(xval, halfsize, zval)};
      }
      console.error('no existing cubes found');
      return null
    };

    var genCubeFar = function(size, used, idxdata){
      if(used.size || used.length){
        var myArr = [];
        used.forEach(function(c){myArr.push(c);});
        var halfsize = size/2;
        var halfrad = 6/2; //avoid radius
        var anchorIdx = myArr[getRandomInt(0, myArr.length-1)];
        var aPos = idxdata[anchorIdx].position;
        var fieldmin = -(appConst.fieldsize/2) + (size/2);
        var fieldmax = (appConst.fieldsize/2) - (size/2);
        var min = -halfrad + halfsize;
        var max = halfrad - halfsize;
        var val = {x: appConst.fieldsize, z: appConst.fieldsize};
        var it = 0;
        while(val.x > fieldmax || val.x < fieldmin ||
        val.z > fieldmax || val.z < fieldmin ||
        (val.x > aPos.x+min && val.x < aPos.x+max
        && val.z > aPos.z+min && val.z < aPos.z+max)){
          val.x = getRandomInt(fieldmin, fieldmax);
          val.z = getRandomInt(fieldmin, fieldmax);
          it++;
          if(it > 50) console.warn('it > 50 pos:', val);
        }
        return {anchorCid: anchorIdx, position: new BABYLON.Vector3(val.x, halfsize, val.z)};
      }
      console.error('no existing cubes found');
      return null
    };

    var genCubeState0 = function(used, idxdata, ltype){
      var cid = getRandomInt(0,14);
      while(used.has(cid)){
        cid = getRandomInt(0,14);
      }
      var data = {prop: $scope.cubeprops[cid]};
      if(used.size){
        if(ltype == 'near'){
          var cubeDat = genCubeNear(data.prop.size, used, idxdata);
          if(cubeDat) data.position = cubeDat.position;
        }
        else{
          var cubeDat = genCubeFar(data.prop.size, used, idxdata);
          if(cubeDat) data.position = cubeDat.position;
        }
      }
      else{
        var min = -(appConst.fieldsize/2) + (data.prop.size/2);
        var max = (appConst.fieldsize/2) - (data.prop.size/2);
        //min = max = 0;
        data.position = new BABYLON.Vector3(getRandomInt(min, max), (data.prop.size/2), getRandomInt(min, max));
      }
      updateYCube(data, used, idxdata);
      used.add(cid);
      idxdata[cid] = data;
      return data;
    };

    $scope.showInitFrame = function(state){
      $scope.resetWorld();
      state.forEach(function(s){
        var c = cubeslist[s.prop.cid];
        c.position = new BABYLON.Vector3(s.position.x, s.position.y, s.position.z);
        c.isVisible = true;
        if(hasPhysics) c.setPhysicsState({
          impostor: BABYLON.PhysicsEngine.BoxImpostor,
          move: true,
          mass: c.boxsize,
          friction: fric,
          restitution: rest
        });
      })
    };

    var showFrame = function(state){
      $scope.resetWorld();
      state.forEach(function(frame){
        var c = cubeslist[frame.cid];
        c.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
        c.rotationQuaternion = new BABYLON.Quaternion(frame.rotquat.x, frame.rotquat.y, frame.rotquat.z, frame.rotquat.w);
        c.isVisible = true;
        if(hasPhysics) c.setPhysicsState({
          impostor: BABYLON.PhysicsEngine.BoxImpostor,
          move: true,
          mass: c.boxsize,
          friction: fric,
          restitution: rest
        });
      })
    };

    var findBy = function(type, key, collection){
      return _.find(collection, function(a){return key === a[type]});
    };


    var insertGen = function(used, ltype, curstate, previd, prevscreen){
      var str = '';
      used.forEach(function(cid){
        var c = cubeslist[cid];
        str += cid + ':' + c.position.x + ':' + c.position.y + ':' + c.position.z+'\n';
      });
      var sig = md5.createHash(str);
      var mygstate = findBy('sig', sig, genstates);
      if(!mygstate){
        var max = appConst.fieldsize/2 + 0.001; //give it a little wiggle room
        var min = -max;
        var frame = [];
        var isValid = true;
        var cnt = 0;
        used.forEach(function(cid){
          cnt++;
          var c = cubeslist[cid];
          if((c.position.x-c.boxsize/2) >= min && (c.position.x+c.boxsize/2) <= max &&
            (c.position.z-c.boxsize/2) >= min && (c.position.z+c.boxsize/2) <= max)
          {
            var dat = {cid: cid, name: c.name, position: c.position.clone(), rotquat: c.rotationQuaternion.clone()};
            frame.push(dat);
          }
          else{
            isValid = false;
            console.warn(c.position.x- c.boxsize/2, c.position.x+ c.boxsize/2,
              c.position.z- c.boxsize/2, c.position.z+ c.boxsize/2
            );
          }
        });
        if(!isValid){
          toaster.pop('error', 'Cube(s) Out of Bounds!');
          return false;
        }
        var sc = BABYLON.Tools.CreateScreenshot(engine, camera, {width: canvas.width, height: canvas.height});
        var b64encoded = btoa(Uint8ToString(screenRaw));
        var mystate = {
          sig: sig,
          cubecnt: cnt,
          frame: frame,
          screencap: b64encoded,
          ltype: ltype,
          public: true,
          created: (new Date).getTime()
        };
        mystate.next = null;
        if(previd){
          if(!mystate.prev) mystate.prev = [];
          mystate.prev.push(previd);
        }
        else mystate.prev = null;
        genstates.save(mystate).then(function(val){
          console.warn(val[0]);
          $scope.dbid = val[0]._id;
          if(previd){
            $scope.$meteorSubscribe("genstates", previd).then(
              function(sub){
                var myframe = findBy('_id', previd, genstates);
                if(!myframe.next) myframe.next = [];
                myframe.next.push($scope.dbid);
                saveState();
              }
            )
          }
          else saveState();

          //save to a state
          function saveState(){
            var statelobj = findBy('stateid', curstate, stateslist);
            if(statelobj){
              if(!statelobj.near) statelobj.near = [];
              if(!statelobj.far) statelobj.far = [];
              var listidx = _.indexOf(statelobj.list, $scope.dbid);
              console.warn('listidx', listidx);
              if(listidx < 0){
                statelobj.list.push($scope.dbid);
                statelobj[ltype].push($scope.dbid);
              }
              else console.warn('found in state list ', curstate, $scope.dbid);
              toaster.pop('info', 'State ' + $scope.dbid + ' Saved');
              if(previd){
                showImage(prevscreen, 'ID:'+previd+'&nbsp;Before');
                showImage(b64encoded, 'ID:'+$scope.dbid+'&nbspAfter');
              }
              else
                showImage(b64encoded, $scope.dbid);
            }
            else{
              var state = {
                stateid: curstate,
                list: [$scope.dbid],
                public: true,
                created: (new Date).getTime()
              }
              state[ltype] = [$scope.dbid];
              stateslist.save(state).then(function(val){
                toaster.pop('info', 'State ' + $scope.dbid + ' Saved');
                if(previd){
                  showImage(prevscreen, 'ID:'+previd+'&nbsp;Before');
                  showImage(b64encoded, 'ID:'+$scope.dbid+'&nbspAfer');
                }
                else
                  showImage(b64encoded, 'ID:'+$scope.dbid);
              }, function(err){
                toaster.pop('error', 'State list ' + curstate + ' id ' + $scope.dbid, err.reason);
              })
            }
          }
        }, function(err){
          toaster.pop('error', 'State ' + $scope.dbid, err.reason);
        });
        return true;
      }
      else{
        toaster.pop('warning', 'State already exists!');
        return false;
      }
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

    var state = [];
    var checkFnSS; //store steady state check
    var waitForSSAndSave = function(params){
      checkFnSS = setInterval(function(){
        if(isSteadyState){
          console.warn('isSteadystate');
          clearInterval(checkFnSS);
          var insRet = insertGen(params.cubesused, params.ltype, params.cstate, params.prev, params.prevscreen);
          console.warn('insRet', insRet);
          if(insRet){
            if(params.itr > 0) $scope.startGen(params.ccnt, params.itr-1, params.ltype, params.cstate);
            else{
              $scope.dbid = null;
              $scope.curitr = 0;
            }
          }
          else{
            //don't iterate since we had error with previous insert
            //which means we need to make a new init state
            $scope.startGen(params.ccnt, params.itr, params.ltype, params.cstate);
          }
        }
      }, 200);
    };

    $scope.showGallery = function(cstate, shonext, itr){
      console.warn('showGallery', cstate, shonext, itr);
      var statel = $rootScope.mdbArray(GenStates, {stateid: Number(cstate)}, {
        sort: {"_id": 1}}, "_id");
      
      console.warn(statel);
      if(itr === undefined || itr < 0){
        itr = statel.length - 1;
        $('[id^=div]').remove();
        $('[id^=rowdiv]').remove();
      } //if first run for state n+1
      if(itr > -1){
        $scope.curitr = itr;
        var sid = statel[itr];
        //we must get the state for this sid
        $scope.$meteorSubscribe("genstates", sid).then(
          function(sub){
            var myframe = GenStates.findOne({_id: sid});
            console.warn('frame', myframe);
            if(shonext && myframe.next){
              function itNext(idx, list, cb){
                if(_.isUndefined(list[idx])) return cb();
                var nsid = list[idx];
                console.warn('nsid', nsid);
                $scope.$meteorSubscribe("genstates", nsid).then(
                  function(sub){
                    var nextframe = GenStates.findOne({_id: nsid});
                    var lenID = $('div').length;
                    var eleDivID = 'rowdiv' + lenID; // Unique ID
                    var htmlout =
                      '<div id="statea'+lenID+'"></div>' +
                      '<div class="fa fa-chevron-right col-sm-1" style="margin-top: 1em; font-size: 60px;"></div>' +
                      '<div id="stateb'+lenID+'"></div>';
                    var attachTo = '#galleryarea';
                    $('<div>').attr({
                      id: eleDivID
                    }).addClass('col-sm-12')
                      .html(htmlout).css({"border-bottom": '1px solid #e4eaec'}).appendTo(attachTo);

                    showImage(myframe.screencap, 'ID: ' + sid, 'Cubes:' + myframe.cubecnt, 'statea'+lenID);
                    showImage(nextframe.screencap, 'ID: ' + nsid, 'Cubes:' + nextframe.cubecnt, 'stateb'+lenID);
                    itNext(idx+1, list, cb);
                  }
                )
              }
              itNext(0, myframe.next, function(){
                if(itr > 0) $scope.showGallery(cstate, shonext, itr - 1);
              })
            }
            else{
              if(myframe)
                showImage(myframe.screencap, 'ID: ' + sid, 'Cubes:' + myframe.cubecnt);
              if(itr > 0) $scope.showGallery(cstate, shonext, itr - 1);
            }
          }
        )
      }
      else toaster.pop('info', 'No data available for state:'+cstate);
    };

    $scope.showState = function(sid){
      console.warn('showState', sid); //tkLBwtYvZ7ndYSheM
      //we must get the state for this sid
      $scope.$meteorSubscribe("genstates", sid).then(
        function(sub){
          var myframe = GenStates.findOne({_id: sid});
          showImage(myframe.screencap, 'ID:'+sid);
          showFrame(myframe.frame);
        }
      )
    };

    var getStackCubes = function(mycube, used, cid){
      var retStack = [];
      for(var i = 0; i < used.length; i++){
        if(cid != used[i].prop.cid){
          console.warn('proc', used[i].prop.cid, cid);
          var c = used[i];
          if(intersectsMeshXYZ(mycube, c)){
            //console.warn('intersect', mycube.prop.cid, mycube.position, c.prop.cid, c.position);
            retStack.push(c);
          }
        }
        else console.warn('skipped', cid)
      }
      return retStack;
    };

    $scope.genStateN = function(params){
      console.warn('genStateN', params.sid);
      //we must get the state for this params.sid
      $scope.$meteorSubscribe("genstates", params.sid).then(
        function(sub){
          var myframe = GenStates.findOne({_id: params.sid});
          console.warn(myframe.frame);
          if(!params.ltype) //show when we use 'show state' input
            showImage(myframe.screencap, 'ID:'+params.sid+'&nbsp;Show');
          //showFrame(myframe.frame);
          //create a munge of cube position rotate and props
          var used = [];
          var cidlist = [];
          var cubeInWorld = {};
          var cubesused = new Set();
          _.forEach(myframe.frame, function(p,i){
            var val = {prop: $scope.cubeprops[p.cid], position: p.position, rotquat: p.rotquat};
            used.push(val);
            cubeInWorld[p.cid] = val;
            cidlist.push(p.cid);
            cubesused.add(p.cid);
          });
          var cubeDat;
          if(params.ltype){
            console.warn(params.ltype);
            if(params.ltype == 'near'){
              cubeDat = genCubeNear(0, cidlist, cubeInWorld);
            }
            else{
              cubeDat = genCubeFar(0, cidlist, cubeInWorld);
            }
          }
          else cubeDat = genCubeNear(0, cidlist,cubeInWorld); //we use size 0 here since we will use the anchor cube size later
          var acube = cubeInWorld[cubeDat.anchorCid];
          var cubeStack = getStackCubes(acube, used, cubeDat.anchorCid);
          //get the cubes left in the world
          cidlist.splice(_.indexOf(cidlist, acube.prop.cid), 1);
          cubeStack.forEach(function(c){cidlist.splice(_.indexOf(cidlist, c.prop.cid), 1)});
          var basePos = {x: acube.position.x, y: acube.position.y, z: acube.position.z}; //store base Y
          acube.position = cubeDat.position;
          acube.position.y = acube.prop.size/2; //translate it down to the ground
          /*acube.position.x = 0;
           acube.position.z = 0;*/
          console.warn('acube', acube.prop.name, acube.position, cubeStack, cidlist);
          updateYCube(acube, cidlist, cubeInWorld);
          var delta = {x: acube.position.x - basePos.x, y: acube.position.y - basePos.y, z: acube.position.z - basePos.z};
          cubeStack.forEach(function(c){
            c.position.x += delta.x;
            c.position.y += delta.y;
            c.position.z += delta.z;
          });
          //rebuild frame and show
          _.forEach(myframe.frame, function(p,i){
            myframe.frame[i].position = cubeInWorld[p.cid].position;
          });
          showFrame(myframe.frame);
          console.warn('acube', acube.prop.name, acube.position, cubeStack, cidlist);
          console.warn('cubeInWorld', cubeInWorld);
          //this is a iterate state generation so lets save the info
          if(params.cstate){
            params.cubesused = cubesused;
            params.prev = params.sid;
            params.prevscreen = myframe.screencap;
            waitForSSAndSave(params);
          }
        }
      )
    };

    $scope.myreplay = null;
    $scope.frameid = -1;
    var showReplay = function(idx){
      var frameScene = $scope.myreplay.data.act[idx];
      frameScene.forEach(function(frame){
        var cube = cubesnamed[frame.name];
        cube.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
        cube.rotationQuaternion = new BABYLON.Quaternion(frame.rotquat.x, frame.rotquat.y, frame.rotquat.z, frame.rotquat.w);
        cube.isVisible = true;
      })
    };

    $scope.renderviewdata = [
      {
        name: 'Front',
        campos: new BABYLON.Vector3(0, 15, -30),
        billb: new BABYLON.Vector3(0, 10, 40)
      }
      /*,{
       name: 'Back',
       campos: new BABYLON.Vector3(25, 15, 25),
       billb: new BABYLON.Vector3(-20, 10, -20)
       },
       {
       name: 'Left',
       campos: new BABYLON.Vector3(-35, 15, 0),
       billb: new BABYLON.Vector3(40, 10, 0)
       },
       {
       name: 'Right',
       campos: new BABYLON.Vector3(35, 15, 0),
       billb: new BABYLON.Vector3(-40, 10, 0)
       }*/
    ];
    // Now, call the createScene function that you just finished creating
    var scene;
    var grid;
    /*createWorld();
    genCubeProps();*/

    dataReady('world created');
  }]);