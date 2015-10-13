/**========================================================
 * Module: gen-world-view.js
 * Created by wjwong on 9/9/15.
 =========================================================*/
angular.module('angle').controller('genWorldCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', 'ngDialog', 'toaster', 'APP_CONST', 'md5', 'Utils', 'ngTableParams', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, ngDialog, toaster, APP_CONST, md5, utils, ngTableParams){
    "use strict";

    var hasPhysics = true;
    var fric = 0.1;
    var rest = 0.2;
    var showGrid = true;
    
    var screenshotCanvas = document.getElementById('screencap');
    var screenRaw;
    BABYLON.Tools.DumpFramebuffer = function(width, height, engine){
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
    var cubesdata = {};
    var cubesid;
    //var cubesdesctocid = {};
    var numcubes = 0;
    var cubecolors = ['red', 'blue', 'green', 'cyan', 'magenta', 'yellow'];
    var cubenames = ['adidas', 'bmw', 'burger king', 'coca cola', 'esso', 'heineken', 'hp', 'mcdonalds', 'mercedes benz', 'nvidia', 'pepsi', 'shell', 'sri', 'starbucks', 'stella artois', 'target', 'texaco', 'toyota', 'twitter', 'ups'];
    var colorids = {};
    colorids['red'] = (new BABYLON.Color3.FromInts(255,0,0));
    colorids['blue'] = (new BABYLON.Color3.FromInts(0,0,255));
    colorids['magenta'] = (new BABYLON.Color3.FromInts(200,0,200));
    colorids['yellow'] = (new BABYLON.Color3.FromInts(255,255,0));
    colorids['cyan'] = (new BABYLON.Color3.FromInts(34,181,191));
    colorids['purple'] = (new BABYLON.Color3.FromInts(135,103,166));
    colorids['green'] = (new BABYLON.Color3.FromInts(0,255,0));
    colorids['orange'] = (new BABYLON.Color3.FromInts(233,136,19));
    //['#d2315d', '#f7c808', '#22b5bf', '#8767a6', '#88c134', '#e98813'];
    var cubesize = {
      s: 1,
      m: 2,
      l: 3
    };
    var camera;

    var numTextures = new Array(21);
    /**
     * Create Dynamic number textures for use in cubes
     */
    var createNumTexture = function(scene){
      for(var i = 0; i < numTextures.length; i++){
        numTextures[i] = new BABYLON.DynamicTexture("dynamic texture", 256, scene, true);
        numTextures[i].drawText(i, 32, 128, "bold 140px verdana", "black", "#aaaaaa");
      }
    };
    
    /**
     * Create cubes based on size s m l and color
     * data: size, color scene, pos (position)
     * @param data
     */
    var createCube = function(data){
      var block = data.block;
      var boxsize = block.shape.shape_params.side_length;
      var objdesc = block.name + '_' + block.shape.type + '_' + boxsize;
      var objname = objdesc + '_' + block.id;
      var boxcolor = colorids['orange'];
      var boxmat = new BABYLON.StandardMaterial(objname, data.scene);
      //boxmat.diffuseTexture.hasAlpha = true;
      //boxmat.specularColor = BABYLON.Color3.Black();
      boxmat.alpha = 1.0;
      //boxmat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
      var boxt;
      if($scope.showLogos)
        boxt = new BABYLON.Texture("img/textures/logos/" + block.name.replace(/ /g, '') + '.png', scene);
      else
        boxt = numTextures[block.id];
      boxt.uScale = boxt.vScale = 1;
      boxmat.diffuseTexture = boxt;
      //boxmat.diffuseColor = boxcolor;
      //boxmat.alpha = 0.8;
      /*var hSpriteNb =  14;  // 6 sprites per raw
      var vSpriteNb =  8;  // 4 sprite raws
      var faceUV = new Array(6);
      for (var i = 0; i < 6; i++) {
        faceUV[i] = new BABYLON.Vector4(0/hSpriteNb, 0, 1/hSpriteNb, 1 / vSpriteNb);
      }*/
      console.warn(objname, boxsize);
      var faceCol = new Array(6);
      for (var i = 0; i < 6; i++) {
        var cv = colorids[block.shape.shape_params['face_'+(i+1)].color];
        faceCol[i] = new BABYLON.Color4(cv.r, cv.g, cv.b, 1);
      }
      var opt = {
        width: boxsize,
        height: boxsize,
        depth: boxsize
        ,faceColors: faceCol
        //,faceUV: faceUV
      };
      var box = BABYLON.Mesh.CreateBox(objname, opt, data.scene);
      //var box = BABYLON.Mesh.CreateBox(objname, boxsize, data.scene);
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
      cubesdata[block.id] = {objidx: cubeslist.length, meta: block};
      cubeslist.push(box);
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
      console.warn('oimo',oimo);
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), oimo);
      // Change the scene background color to green.
      scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
      scene.collisionsEnabled = true;
      scene.workerCollisions = true;

      //  Create an ArcRotateCamera aimed at 0,0,0, with no alpha, beta or radius, so be careful.  It will look broken.
      camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 0, 0, APP_CONST.fieldsize, new BABYLON.Vector3(0, 0, 0), scene);
      // Quick, let's use the setPosition() method... with a common Vector3 position, to make our camera better aimed.
      camera.setPosition(new BABYLON.Vector3(0, APP_CONST.fieldsize*0.95, -(APP_CONST.fieldsize*0.8)));
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
      light.intensity = 1.0;
      // this creates dir. light for shadows
      /*var dirlight = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-0.4, -2, -0.4), scene);
      // Dim the light a small amount
      dirlight.intensity = 0.6;
      dirlight.position = new BABYLON.Vector3(0, 40, 0);*/

      /*var pl = new BABYLON.PointLight("pl", new BABYLON.Vector3(0, 10, 0), scene);
      pl.diffuse = new BABYLON.Color3(1, 1, 1);
      pl.specular = new BABYLON.Color3(1, 1, 1);
      pl.intensity = 0.8;*/

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
      var ground = BABYLON.Mesh.CreateBox("ground", 200, scene);
      ground.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
      ground.position.y = -0.1;
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
      var tableboxsize = APP_CONST.fieldsize;
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
      grid = BABYLON.Mesh.CreateGround("grid", APP_CONST.fieldsize, APP_CONST.fieldsize, 6, scene, false); //used to show grid
      grid.position.y = 0.01;
      grid.scaling.y = 0.001;
      grid.material = gridmat;

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
      //create dynamic number textures
      createNumTexture(scene);
      // Register a render loop to repeatedly render the scene
      engine.runRenderLoop(updateRender(scene));
    };

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
      engine.resize();
    });

    //**start app================================================================
    //**3D helpers
    var createObjects = function(blocks){
      if(cubeslist.length) cubeslist.forEach(function(c){
        if(hasPhysics) oimo.unregisterMesh(c); //stop physics
        c.dispose();
      });
      cubeslist.length = 0;
      cubesdata = {};
      numcubes = 0;
      var p = -2;
      var i = 0;
      var z = 0;
      var zpos = [0,1,2];
      for(var j = 0; j < blocks.length; j++){
        createCube({pos: new BABYLON.Vector3((p+i),blocks[j].shape.shape_params.side_length, zpos[z]), scene: scene, block: blocks[j], isVisible: true});
        if(i > 3){i = 0; z++;}
        else i++;
      }
      cubesid = Object.keys(cubesdata);
    };

    var get3DCubeById = function(cid){
      return cubeslist[cubesdata[cid].objidx];
    };

    //**start app logic============================================================
    $scope.showLogos = false;

    function CurrentState(){
      this.clear =  function(){
        this.block_meta = null; this.block_state = null;
        this.stateitr = -1; this.stateid = null;
        this.next = null; this.prev = null;
      };
      this.copy = function(s){
        var l = ['block_meta', 'block_state', 'stateitr', 'next', 'prev'];
        for(var i = 0; i < l.length; i++){
          this[l[i]] = s[l[i]];
        }
        this.stateid = s._id;
      };
      this.clear();
    }
    $scope.curState = new CurrentState();

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
        $scope.statenum = utils.mdbArray(GenStates, {}, {
          sort: {stateitr: 1}, fields: {stateitr: true}
        }, "stateitr");
        $rootScope.dataloaded = true;
      }
    };

    $scope.resetWorld = function(){
      var c;
      var p = -2, i = 0, z = 0;
      var zpos = [7,8,9,10];
      for(var j = 0; j < cubeslist.length; j++){
        c = cubeslist[j];
        if(hasPhysics) oimo.unregisterMesh(c); //stop physics
        c.position = new BABYLON.Vector3((p+i), c.boxsize, zpos[z]);
        c.rotationQuaternion = BABYLON.Quaternion.Identity().clone();
        c.isVisible = true;
        if(i > 3){i = 0; z++;}
        else i++;
      }
      camera.setPosition(new BABYLON.Vector3(0, APP_CONST.fieldsize*0.95, -(APP_CONST.fieldsize*0.8)));
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
    var genCubeNear = function(size, used, idxdata){
      if(used.size || used.length){
        var myArr = [];
        if(used.size) used.forEach(function(c){myArr.push(c);});
        else myArr = used; //its an array
        var halfsize = size/2;
        var halfrad = APP_CONST.fieldsize/4; //near radius
        var anchorIdx = myArr[utils.rndInt(0, myArr.length-1)];
        var aPos = idxdata[anchorIdx].position;
        var fieldmin = -(APP_CONST.fieldsize/2) + (size/2);
        var fieldmax = (APP_CONST.fieldsize/2) - (size/2);
        var min = -halfrad + halfsize;
        var max = halfrad - halfsize;
        var val = APP_CONST.fieldsize;
        var it = 0;
        while(val > fieldmax || val < fieldmin){
          val = utils.rndInt(min, max) + aPos.x;
          if(it > 50){console.warn('it > 50 posx:', val);};
        }
        var xval = val;
        val = APP_CONST.fieldsize;
        it = 0;
        while(val > fieldmax || val < fieldmin){
          val = utils.rndInt(min, max) + aPos.z;
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
        if(used.size) used.forEach(function(c){myArr.push(c);});
        else myArr = used; //its an array
        var halfsize = size/2;
        var halfrad = APP_CONST.fieldsize/4; //avoid radius
        var anchorIdx = myArr[utils.rndInt(0, myArr.length-1)];
        var aPos = idxdata[anchorIdx].position;
        var fieldmin = -(APP_CONST.fieldsize/2) + (size/2);
        var fieldmax = (APP_CONST.fieldsize/2) - (size/2);
        var min = -halfrad + halfsize;
        var max = halfrad - halfsize;
        var val = {x: APP_CONST.fieldsize, z: APP_CONST.fieldsize};
        var it = 0;
        while(val.x > fieldmax || val.x < fieldmin ||
          val.z > fieldmax || val.z < fieldmin ||
          (val.x > aPos.x+min && val.x < aPos.x+max 
          && val.z > aPos.z+min && val.z < aPos.z+max)){
          val.x = utils.rndInt(fieldmin, fieldmax);
          val.z = utils.rndInt(fieldmin, fieldmax);
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
    var genCubeStack = function(size, used, idxdata){
      if(used.size || used.length){
        var myArr = [];
        if(used.size) used.forEach(function(c){myArr.push(c);});
        else myArr = used; //its an array
        var aidx = utils.rndInt(0, myArr.length-1); //cube to move
        var anchorIdx = myArr[aidx];
        var halfsize = idxdata[anchorIdx].prop.size/2;
        var aPos = idxdata[anchorIdx].position;
        //console.warn('genCubeStack', anchorIdx, aPos);
        return {anchorCid: anchorIdx, position: new BABYLON.Vector3(aPos.x, halfsize, aPos.z)};
      }
      console.error('no existing cubes found');
      return null
    };

    var genCubeState0 = function(used, idxdata){
      var cid = null;
      while(cid === null || used.has(cid)){
        cid = cubesid[utils.rndInt(0,cubesid.length-1)];
      }
      var data = {prop: {size: cubesdata[cid].meta.shape.shape_params.side_length, cid: cid}};
      if(used.size){
        var ltype = utils.rndInt(0, 9);
        if(ltype < 5){
          //console.warn('state0 near');
          var cubeDat = genCubeNear(data.prop.size, used, idxdata);
          if(cubeDat) data.position = cubeDat.position;
        }
        else{
          //console.warn('state0 far');
          var cubeDat = genCubeFar(data.prop.size, used, idxdata);
          if(cubeDat) data.position = cubeDat.position;
        }
      }
      else{
        var min = -(APP_CONST.fieldsize/2) + (data.prop.size/2);
        var max = (APP_CONST.fieldsize/2) - (data.prop.size/2);
        //min = max = 0;
        data.position = new BABYLON.Vector3(utils.rndInt(min, max), (data.prop.size/2), utils.rndInt(min, max));
      }
      updateYCube(data, used, idxdata);
      used.add(cid);
      idxdata[cid] = data;
      console.warn('genCubeState0', cid, data);
      return data;
    };

    var stateNStats = {near: 0, far: 0, stack: 0};
    $scope.genStateN = function(params){
      console.warn('genStateN', params.sid);
      //we must get the state for this params.sid
      $scope.$meteorSubscribe("genstates", params.sid).then(
        function(sub){
          var myframe = GenStates.findOne({_id: params.sid});
          //if(!params.cstate) //show when we use 'show state' input
            //showImage(myframe.screencap, params.sid, '&nbsp;Show');
          //showFrame(myframe);
          //create a munge of cube position rotate and props
          var used = [];
          var cidlist = [];
          var cubeInWorld = {};
          var cubesused = new Set();
          //create updated blockmeta
          var cubemeta = {};
          var maxsize = 0;
          _.each(myframe.block_meta.blocks, function(m){cubemeta[m.id] = m;});
          _.each(myframe.block_state, function(p,i){
            var size = cubemeta[p.id].shape.shape_params.side_length;
            if(maxsize < size) maxsize = size;
            var val = {prop: {cid: p.id, size: size}, position: p.position, rotation: p.rotation};
            used.push(val);
            cubeInWorld[p.id] = val;
            cidlist.push(p.id);
            cubesused.add(p.id);
          });
          var cubeDat;
          //let gencube choose a cube and create a position based on it
          var ltype = utils.rndInt(0,19);
          if(cidlist.length < 2){//only 1 cube so no stacks
            ltype = utils.rndInt(0, 9);
          }
          if(ltype < 10){
            if(ltype < 5){
              cubeDat = genCubeNear(maxsize, cidlist, cubeInWorld);
              stateNStats.near++;
            }
            else{
              cubeDat = genCubeFar(maxsize, cidlist, cubeInWorld);
              stateNStats.far++
            }
          }
          else{
            cubeDat = genCubeStack(maxsize, cidlist, cubeInWorld);
            stateNStats.stack++;
          }
          //now we randomly choose a cube outside of the anchor cube id to move to the new position
          var mycid = cubeDat.anchorCid;
          while(mycid == cubeDat.anchorCid && myframe.block_state.length>1){//choose a cube not the anchor cube
            mycid = myframe.block_state[utils.rndInt(0, myframe.block_state.length-1)].id;
          }
          var acube = cubeInWorld[mycid];
          var cubeStack = getStackCubes(acube, used, mycid);
          //get the cubes left in the world
          cidlist.splice(_.indexOf(cidlist, acube.prop.cid), 1);
          cubeStack.forEach(function(c){cidlist.splice(_.indexOf(cidlist, c.prop.cid), 1)});
          var basePos = {x: acube.position.x, y: acube.position.y, z: acube.position.z}; //store base Y
          acube.position = cubeDat.position;
          acube.position.y = acube.prop.size/2; //translate it down to the ground
          /*acube.position.x = 0;
           acube.position.z = 0;*/
          updateYCube(acube, cidlist, cubeInWorld);
          var delta = {x: acube.position.x - basePos.x, y: acube.position.y - basePos.y, z: acube.position.z - basePos.z};
          cubeStack.forEach(function(c){
            c.position.x += delta.x;
            c.position.y += delta.y;
            c.position.z += delta.z;
          });
          //rebuild frame and show
          for(var i = 0; i < myframe.block_state.length; i++){
            myframe.block_state[i].position = cubeInWorld[myframe.block_state[i].id].position;
          }
          showFrame(myframe, function(){
            //this is a iterate state generation so lets save the info
            $scope.curcnt = params.itr+1;
            $scope.curitr = params.cstate+1;
            params.cubesused = cubesused;
            params.prev = params.sid;
            params.prevscreen = myframe.screencap;
            setTimeout(function(){waitForSSAndSave(params, nextItr(params));}, 400);
          });
        }
      )
    };

    $scope.showInitFrame = function(state, cb){
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
            mass: c.boxsize,
            friction: fric,
            restitution: rest
          });
        })
        if(cb) cb();
      }, 100);
    };

    var showFrame = function(state, cb){
      $scope.resetWorld();
      setTimeout(function(){
        state.block_state.forEach(function(frame){
          var c = get3DCubeById(frame.id);
          c.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
          if(frame.rotation)
            c.rotationQuaternion = new BABYLON.Quaternion(frame.rotation.x, frame.rotation.y, frame.rotation.z, frame.rotation.w);
          c.isVisible = true;
          if(hasPhysics) c.setPhysicsState({
            impostor: BABYLON.PhysicsEngine.BoxImpostor,
            move: true,
            mass: c.boxsize,
            friction: fric,
            restitution: rest
          });
        });
        if(cb) cb();
      }, 100);
    };

    var findBy = function(type, key, collection){
      return _.find(collection, function(a){return key === a[type]});
    };

    var insertGen = function(used, stateitr, previd, prevscreen, creator, name, cb){
      /*var str = '';
      used.forEach(function(cid){
        var c = get3DCubeById(cid);
        str += cid + ':' + c.position.x + ':' + c.position.y + ':' + c.position.z+'\n';
      });
      var sig = md5.createHash(str);
      var mygstate = findBy('sig', sig, genstates);
      if(!mygstate){*/
      if(true){
        var max = APP_CONST.fieldsize/2 + 0.001; //give it a little wiggle room
        var min = -max;
        var frame = [];
        var meta = {blocks: []};
        var isValid = true;
        var cnt = 0;
        used.forEach(function(cid){
          cnt++;
          var c = get3DCubeById(cid);
          if((c.position.x-c.boxsize/2) >= min && (c.position.x+c.boxsize/2) <= max &&
            (c.position.z-c.boxsize/2) >= min && (c.position.z+c.boxsize/2) <= max)
          {
            var dat = {id: cid, position: c.position.clone(), rotation: c.rotationQuaternion.clone()};
            frame.push(dat);
            meta.blocks.push(cubesdata[cid].meta);
          }
          else{
            isValid = false;
            //console.warn('Out',c.position.x- c.boxsize/2, c.position.x+ c.boxsize/2,c.position.z- c.boxsize/2, c.position.z+ c.boxsize/2);
          }
        });
        if(!isValid){
          toaster.pop('error', 'Cube(s) Out of Bounds!');
          return false;
        }
        var sc = BABYLON.Tools.CreateScreenshot(engine, camera, {width: canvas.width, height: canvas.height});
        var b64encoded = btoa(utils.Uint8ToString(screenRaw));
        var mystate = {
          stateitr: stateitr,
          cubecnt: cnt,
          block_state: frame,
          block_meta: meta,
          screencap: b64encoded,
          public: true,
          created: (new Date).getTime()
        };
        if(name) mystate.name = name;
        if(creator) mystate.creator = creator;
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
                console.warn('myframe next', myframe._id, JSON.stringify(myframe.next));
                genstates.save(myframe).then(function(sub){
                  showSaveState();
                }, function(err){console.error('error:'+err)})
              }
            )
          }
          else showSaveState();
          
          function showSaveState(){
            if(previd){
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

              showImage(prevscreen, previd, '&nbsp;Before', 'statea'+lenID);
              showImage(b64encoded, $scope.dbid, '&nbspAfter', 'stateb'+lenID);
            }
            else
              showImage(b64encoded, $scope.dbid);
            cb(null, $scope.dbid);
          }
          //save to a state
          /*function saveState(){
            var statelobj = findBy('stateitr', curstate, stateslist);
            if(statelobj){
              var listidx = _.indexOf(statelobj.list, $scope.dbid);
              if(listidx < 0){
                statelobj.list.push($scope.dbid);
                statelobj.updated = (new Date).getTime();
              }
              else console.warn('found in state list ', curstate, $scope.dbid);
              if(previd){
                if(!statelobj.listtrans) statelobj.listtrans = {};
                statelobj.listtrans[previd + '_' + $scope.dbid] = {ids: {prev: previd, cur: $scope.dbid}};
                statelobj.updated = (new Date).getTime();
                showImage(prevscreen, previd, '&nbsp;Before');
                showImage(b64encoded, $scope.dbid, '&nbspAfter');
              }
              else
                showImage(b64encoded, $scope.dbid);
              toaster.pop('info', 'State ' + $scope.dbid + ' Saved');
            }
            else{
              var state = {
                stateitr: curstate,
                list: [$scope.dbid],
                public: true,
                created: (new Date).getTime(),
                updated: (new Date).getTime()
              };
              if(previd){
                if(!state.listtrans) state.listtrans = {};
                state.listtrans[previd + '_' + $scope.dbid] = {ids: {prev: previd, cur: $scope.dbid}};
              }
              stateslist.save(state).then(function(val){
                toaster.pop('info', 'State ' + $scope.dbid + ' Saved');
                console.warn('stateslist saved', stateslist);
                $scope.statenum = [];
                stateslist.forEach(function(s){
                  $scope.statenum.push(Number(s.stateitr));
                });
                if(previd){
                  showImage(prevscreen, previd, '&nbsp;Before');
                  showImage(b64encoded, $scope.dbid, '&nbspAfer');
                }
                else
                  showImage(b64encoded, $scope.dbid);
              }, function(err){
                toaster.pop('error', 'State list ' + curstate + ' id ' + $scope.dbid, err.reason);
              })
            }
          }*/
        }, function(err){
          cb('State ' + $scope.dbi + ' ' + err.reason);
        });
      }
      else{
        cb('State already exists!');
      }
    };
    
    var showImage = function(b64, id, text, attachID){
      var u8_2 = utils.StringToUint8(b64);

      var eleDivID = 'div' + $('div').length; // Unique ID
      var eleCanID = 'canvas' + $('canvas').length; // Unique ID
      var eleLabelID = 'h4' + $('h4').length; // Unique ID
      var htmlout = '<canvas id="'+eleCanID+'" style="width:'+canvas.width*2/3+'px;height:'+canvas.height*2/3+'px"></canvas>' +
        '<label id="'+eleLabelID+'" class="mb"> ID: '+id+'</label>';
      if(text) htmlout += '<b>'+text+'</b>';
      var attachTo = '#galleryarea';
      if(attachID) attachTo = '#'+attachID;
      $('<div>').attr({
        id: eleDivID
      }).addClass('col-sm-4')
      .html(htmlout).css({}).appendTo(attachTo);
      
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

    var checkFnSS; //store steady state check
    /**
     * check for a scene steady state before saving data.
     * providing a cb will short circuit checks for startgen or startmove functions
     * @param params
     */
    var waitForSSAndSave = function(params, cb){
      checkFnSS = setInterval(function(){
        if(isSteadyState){
          clearInterval(checkFnSS);
          insertGen(params.cubesused, params.cstate, params.prev, params.prevscreen, params.creator, params.name, cb);
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
    $scope.startGen = function(ccnt, itr, strstate){
      var cstate = Number(strstate);
      console.warn('startGen',itr, cstate, ccnt);
      if(cstate == 0){
        if(itr > 0){
          var state = [];
          var cubeidxdata = {};
          var cubesused = new Set();
          var myccnt = utils.rndInt(Number(ccnt.min), Number(ccnt.max));
          for(var i = 0; i < myccnt; i++){
            var dat = genCubeState0(cubesused, cubeidxdata); //save used list
            state.push(dat);
          }
          if(cubesused.size != state.length)
            console.warn('done state!!', cubesused.size, state.length);
          $scope.curitr = cstate;
          $scope.curcnt = itr;
          $scope.showInitFrame(state, function(){
            var params = {ccnt: ccnt, itr: itr, cstate: cstate, cubesused: cubesused, creator: 'system', startGen: $scope.startGen};
            //we need to set a timeout before checking steading states or we get bad block layouts
            setTimeout(function(){waitForSSAndSave(params, nextItr(params));}, 400);
          });
        }
        if(itr === undefined) toaster.pop('error','Please set Iterations');
      }
      else{
        var statel = _.uniq(GenStates.find({stateitr: cstate-1}, {
          sort: {"_id": 1}}).fetch().map(function(x) {
          return x._id;
        }), true);

        if(itr === undefined || itr < 0){
          itr = statel.length - 1; //if first run for state n+1
          console.warn('in length', itr);
        }
        $scope.curitr = cstate;
        $scope.curcnt = itr;
        stateNStats.near = 0;
        stateNStats.far = 0;
        stateNStats.stack = 0;
        var sid = statel[itr];
        var params = {ccnt: ccnt, itr: itr, cstate: cstate, sid: sid, startGen: $scope.startGen};
        $scope.genStateN(params);
      }
    };

    /**
     * show the state to be used as state 0
     * @param sid
     */
    $scope.showState = function(sid){
      //we must get the state for this sid
      $scope.$meteorSubscribe("genstates", sid).then(
        function(sub){
          var myframe = GenStates.findOne({_id: sid});
          if(!myframe) return toaster.pop('warn', 'Invalid State ID');
          //update the meta
          $scope.curitr = myframe.stateitr;
          $scope.curcnt = 0;
          $scope.curState.copy(myframe);
          createObjects($scope.curState.block_meta.blocks);
          //showImage(myframe.screencap, sid);
          showFrame(myframe);
          var data =  $scope.curState.prev;
          /*$scope.tableParams = new ngTableParams({
            page: 1,            // show first page
            count: 10          // count per page
          }, {
            total: data.length, // length of data
            getData: function ($defer, params) {
              console.warn('in getData');
              // use build-in angular filter
              var filteredData = params.filter() ?
                $filter('filter')(data, params.filter()) :
                data;
              var orderedData = params.sorting() ?
                $filter('orderBy')(filteredData, params.orderBy()) :
                data;

              params.total(orderedData.length); // set total for recalc pagination
              $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
            }
          });
          $scope.tableParams.data = data;*/

          /*
          var tempframe = {block_meta: myframe.block_meta, block_state: []};
          for(var i = 0; i < myframe.block_state.length; i++){
            var s = myframe.block_state[i];
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
          console.warn(JSON.stringify(tempframe, null, 2));*/
        }
      )
    };

    $scope.remState = function(sid){
      if(sid){
        genstates.remove(sid);
        toaster.pop('warning', 'Removed ' + sid);
      }
    };

    var getStackCubes = function(mycube, used, cid){
      var retStack = [];
      for(var i = 0; i < used.length; i++){
        if(cid != used[i].prop.cid){
          var c = used[i];
          if(intersectsMeshXYZ(mycube, c)){
            retStack.push(c);
          }
        }
        else console.warn('skipped', cid)
      }
      return retStack;
    };
    
    $scope.myreplay = null;
    $scope.frameid = -1;
    var showReplay = function(idx){
      var frameScene = $scope.myreplay.data.act[idx];
      frameScene.forEach(function(frame){
        var cube = cubesnamed[frame.name];
        cube.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
        cube.rotationQuaternion = new BABYLON.Quaternion(frame.rotation.x, frame.rotation.y, frame.rotation.z, frame.rotation.w);
        cube.isVisible = true;
      })
    };

    $scope.enableImpSave = false;
    /*var impInfo = {};
    $scope.showImportDialog = function(){
      var myfiles;
      var dialog = ngDialog.open({
        template: 'didImportFile',
        controller: ['$scope', function($scope){
          camera.detachControl(canvas);
          //allow for change file list to be stored
          $scope.importFileChanged = function(event){
            myfiles = event.target.files;
          }
        }]
      });
      dialog.closePromise.then(function(data){
        camera.attachControl(canvas, true);
        console.log('showImportDialog ngDialog closed', data);
        if(myfiles && myfiles.length){
          //read file
          var reader = new FileReader();
          reader.onload = function(){
            impInfo.cubesused = new Set();
            var impdat = JSON.parse(reader.result);
            impdat.block_state.forEach(function(f){
              impInfo.cubesused.add(f.id);
            });
            impInfo.ccnt = impInfo.cubesused.size;
            showFrame(impdat, function(){
              $scope.$apply(function(){
                $scope.impFilename = myfiles[0].name.toLowerCase().replace(/\.json/g,'');
                $scope.enableImpSave = true;
              })
            });
          };
          reader.readAsText(myfiles[0]);
        }
      });
    };*/
    
    $scope.cancelImport = function(){
      //must use function to apply to scope
      $scope.impFilename = null;
      $scope.enableImpSave = false;
      $scope.curState.clear();
      $scope.resetWorld();
    };

    $scope.saveImport = function(savename){
      $scope.impFilename = null;
      $scope.enableImpSave = false;
      var cubesused = new Set();
      $scope.curState.block_meta.blocks.forEach(function(b){
        cubesused.add(b.id);
      })
      var params = {ccnt: $scope.curState.block_meta.blocks.length, itr: 0, cstate: $scope.curState.stateitr, cubesused: cubesused, creator: $rootScope.currentUser._id, name: savename};
      setTimeout(function(){waitForSSAndSave(params, 
        function(err, savedsid){
          if(err) toaster.pop('warn', err);
          if(savedsid){
            $scope.curitr = $scope.curState.stateitr;
            $scope.curcnt = 0;
            $scope.curState.stateid = savedsid;
          }
        });
      }, 400);
    };

    $scope.clearMeta = function(){
      $('#galleryarea').empty();
      $scope.curState.clear();
    };

    $scope.loadMeta = function(){
      if($scope.metafilename && $scope.metafilename.length){
        //read file
        var reader = new FileReader();
        reader.onload = function(){
          var filedata = JSON.parse(reader.result);
          if(filedata.blocks && filedata.blocks.length){
            $scope.$apply(function(){
              $scope.curState.clear();
              $scope.curState.stateitr = 0;
              $scope.curState.block_meta = filedata;
              createObjects($scope.curState.block_meta.blocks);
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
          var filedata = JSON.parse(reader.result);
          if(filedata.block_state && filedata.block_state.length
            && filedata.block_meta && filedata.block_meta.blocks && filedata.block_meta.blocks.length){
            $scope.curState.clear();
            $scope.curState.stateitr = 0;
            $scope.curState.block_meta = filedata.block_meta;
            console.warn($scope.curState.block_meta);
            createObjects($scope.curState.block_meta.blocks);
            //mung block_state
            filedata.block_state = mungeBlockState(filedata.block_state);
            showFrame(filedata, function(){
              $scope.$apply(function(){
                if(filedata.name) $scope.impFilename = filedata.name;
                else $scope.impFilename = $scope.statefilename[0].name.toLowerCase().replace(/\.json/g, '');
                $scope.enableImpSave = true;
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

    /**
     * Transform text block states from cwic to internal block states
     * @param bs
     * @returns {Array}
     */
    var mungeBlockState = function(bs){
      var newBS = [];
      bs.forEach(function(b){
        var l = b.position.split(',');
        l.forEach(function(v,i){l[i]=Number(v)});
        var r = b.rotation.split(',');
        r.forEach(function(v,i){r[i]=Number(v)});
        newBS.push({id: b.id, position: {
          x: l[0], y: l[1], z: l[2]
        }, rotation: {
          x: r[0], y: r[1], z: r[2], w: r[3]
        }})
      });
      return newBS;
    };

    $scope.startMove = function(itr, cstate, sid){
      console.warn(itr);

      stateNStats.near = 0;
      stateNStats.far = 0;
      stateNStats.stack = 0;
      if(!cstate) cstate = $scope.curState.stateitr;
      if(!sid) sid = $scope.curState.stateid;
      var params = {itr: itr, cstate: cstate, sid: sid, startMove: $scope.startMove};
      $scope.genStateN(params);
    };

    var nextItr = function(params){
      return function(err, savedsid){
        if(err) toaster.pop('warn', err);
        if(savedsid){
          if(params.itr > 1){
            if(params.startGen) params.startGen(params.ccnt, params.itr - 1, params.cstate);
            if(params.startMove) params.startMove(params.itr - 1, params.cstate + 1, savedsid);
          }
          else{
            $scope.dbid = null;
            $scope.curitr = 0;
            $scope.curcnt = 0;
            //update states
            $scope.statenum = utils.mdbArray(GenStates, {}, {
              sort: {stateitr: 1}, fields: {stateitr: true}
            }, "stateitr");
          }
        }
        else{
          //don't iterate since we had error with previous insert
          //which means we need to make a new init state
          if(params.startGen) params.startGen(params.ccnt, params.itr, params.cstate);
          if(params.startMove) params.startMove(params.itr, params.cstate, params.sid);
        }
      };
    }
    // Start by calling the createScene function that you just finished creating
    var scene;
    var grid;
    createWorld();
    dataReady('world created');
    console.warn($rootScope.currentUser)
  }]);