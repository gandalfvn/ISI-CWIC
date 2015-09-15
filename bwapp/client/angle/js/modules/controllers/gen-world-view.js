/**========================================================
 * Module: gen-world-view.js
 * Created by wjwong on 9/9/15.
 =========================================================*/
angular.module('angle').controller('genWorldCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteorCollection', 'ngDialog', 'toaster', 'APP_CONST', 'md5', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteorCollection, ngDialog, toaster, appConst, md5){
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
              if(c.isMoving && c.zeromoveTicks > 10){//only reset color if it was moving
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
    };

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
      engine.resize();
    });

    /*var textplane;
    var textplaneTexture;
    var textUpdate = function(text, pos) {
      //data reporter
      if(textplane) textplane.dispose();
      textplane = BABYLON.Mesh.CreatePlane("textplane", 20, scene, false);
      textplane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
      textplane.material = new BABYLON.StandardMaterial("textplane", scene);
      textplane.position = pos.clone();
      textplane.scaling.y = 0.4;

      if(textplaneTexture) textplaneTexture.dispose();
      textplaneTexture = new BABYLON.DynamicTexture("dynamic texture", 512, scene, true);
      textplane.material.diffuseTexture = textplaneTexture;
      textplane.material.specularColor = new BABYLON.Color3(0, 0, 0);
      textplane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
      textplane.material.backFaceCulling = false;
      var context2D = textplaneTexture.getContext();

      //context2D.clearRect(0, 0, 512, 512);
      textplaneTexture.drawText(text, null, 256, "bold 140px verdana", "black", "#aaaaaa");
    };*/

    //**start app========
    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     * Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var cubecolors = ['red', 'yellow', 'cyan', 'purple', 'green', 'orange'];
    $scope.cubeprops = [];
    for(var s = 1; s < 4; s++){
      for(var i = 0; i < 5; i++){
        $scope.cubeprops.push({color: i, size: s, cid: (s-1)*5+i});
      }
    }

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

    
    var genstates = $meteorCollection(GenStates).subscribe('genstates');
    Meteor.subscribe("genstates", {
      onReady: function () {dataReady('genstates');},
      onError: function () { console.log("onError", arguments); }
    });

    $scope.showTime = function(){
      return (new Date).getTime();
    };

    var readydat = [];
    var dataReady = function(data){
      console.warn('ready ', data, (new Date).getTime());
      readydat.push(data);
      if(readydat.length > 1){
        $scope.$apply(function(){$rootScope.dataloaded = true;});
      }
    };

    /**
     * Overlap check for mesh in the x z footprint
     * @param src
     * @param tgt
     * @returns {boolean}
     */
    var intersectsMeshXZ = function(src, tgt){
      var s = (src.prop.size/2)-0.01; //slightly small
      var a = {
      };
      s = tgt.prop.size/2;
      var b = {
      }

      if (a.max.x < b.min.x) return false; // a is left of b
      if (a.min.x > b.max.x) return false; // a is right of b
      if (a.max.y < b.min.y) return false; // a is above b
      if (a.min.y > b.max.y) return false; // a is below b
      return true; // boxes overlap
    };

    /**
     * Check for cube overlap and increase height based on in order cube creation
     * @param mycube - current cube
     * @param used - list of cubes already created in fifo order
     * @param idxdata - index associative array to get prev cube positions
     */
    var checkYCube = function(mycube, used, idxdata){
      //set cube to position
      used.forEach(function(cid){
        var c = idxdata[cid];
        if(intersectsMeshXZ(mycube, c)){
          ypos += c.prop.size;
        }
      });
    };

    var genCube = function(used, idxdata){
      var cid = getRandomInt(0,14);
      while(used.has(cid)){
        cid = getRandomInt(0,14);
      }
      var data = {prop: $scope.cubeprops[cid]};
      var min = -(appConst.fieldsize/2) + (data.prop.size/2);
      var max = (appConst.fieldsize/2) - (data.prop.size/2);
      data.pos = new BABYLON.Vector3(getRandomInt(min, max), (data.prop.size/2), getRandomInt(min, max));
      console.warn(data.pos);
      checkYCube(data, used, idxdata);
      used.add(cid);
      idxdata[cid] = data;
      return data;
    };

    $scope.showFrame = function(){
      $scope.resetWorld();
      state.forEach(function(s){
        var c = cubeslist[s.prop.cid]; 
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

    var findByIdkey = function(collection, idkey){
      return _.find(collection, function(a){return idkey === a.idkey});
    };

    var Uint8ToString = function(u8a){
      var CHUNK_SZ = 0x8000;
      var c = [];
      for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
        c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
      }
      return c.join("");
    }
    
    var insertGen = function(init, used){
      var str = '';
      init.forEach(function(s){
      })
      var idkey = md5.createHash(str);
      var mygstate = findByIdkey(genstates, idkey);
      if(!mygstate){
        var frame = [];
        used.forEach(function(cid){
          var c = cubeslist[cid];
        });
        var sc = BABYLON.Tools.CreateScreenshot(engine, camera, {width: canvas.width, height: canvas.height});
        var b64encoded = btoa(Uint8ToString(screenRaw));
        var mystate = {
          idkey: idkey,
          init: init,
          cubecnt: state.length,
          frame: frame,
          screencap: b64encoded,
          next: null,
          prev: null,
          public: true
        };
        genstates.save(mystate).then(function(val){
          console.warn(val);
          $scope.dbid = val[0]._id;
        }, function(err){
        });
      }
      else{
      }
    };
    
      // Copy the pixels to a 2D canvas
      var data = imageData.data;
      for (var i = 0, len = u8_2.length; i < len; i++) {
        data[i] = u8_2[i];
      }
      context.putImageData(imageData, 0, 0);
    };

    var state = [];
    var checkFnSS; //store steady state check
    $scope.startGen = function(ccnt, itr){
      var cubeidxdata = {};
      var cubesused = new Set();
      state.length = 0;
      for(var i = 0; i < ccnt; i++){
        var dat = genCube(cubesused, cubeidxdata);
        state.push(dat);
      }
      $scope.curitr = itr;
      $scope.showFrame();
      checkFnSS = setInterval(function(){
        if(isSteadyState){
          clearInterval(checkFnSS);
        }
      }, 200);
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
    createWorld();
    dataReady('world created');
  }]);