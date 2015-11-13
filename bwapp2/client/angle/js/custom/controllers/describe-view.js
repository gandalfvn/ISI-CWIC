/**========================================================
 * Module: describe-view
 * Created by wjwong on 9/1/15.
 =========================================================*/
angular.module('angle').controller('describeCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteorCollection', 'ngDialog', 'toaster', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteorCollection, ngDialog, toaster){
    "use strict";

    var hasPhysics = false;
    var showGrid = true;

    var screenshotCanvas;
    BABYLON.Tools.DumpFramebuffer = function (width, height, engine) {
      console.log("MY version of DumpFramebuffer - Activated!", screenshotCanvas);
      // Read the contents of the framebuffer
      var numberOfChannelsByLine = width * 4;
      var halfHeight = height / 2;
      //Reading datas from WebGL
      var data = engine.readPixels(0, 0, width, height);
      for (var i = 0; i < halfHeight; i++) {
        for (var j = 0; j < numberOfChannelsByLine; j++) {
          var currentCell = j + i * numberOfChannelsByLine;
          var targetLine = height - i - 1;
          var targetCell = j + targetLine * numberOfChannelsByLine;
          var temp = data[currentCell];
          data[currentCell] = data[targetCell];
          data[targetCell] = temp;
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
      castData.set(data);
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
      console.warn(objname);
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

    // This begins the creation of a function that we will 'call' just after it's built
    var createScene = function () {
      // Now create a basic Babylon Scene object
      var scene = new BABYLON.Scene(engine);
      var oimo = new BABYLON.OimoJSPlugin();
      scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), oimo);
      // Change the scene background color to green.
      scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
      scene.collisionsEnabled = true;
      scene.workerCollisions = true;

      //  Create an ArcRotateCamera aimed at 0,0,0, with no alpha, beta or radius, so be careful.  It will look broken.
      camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 0, 0, 20, new BABYLON.Vector3(0, 4, 0), scene);
      // Quick, let's use the setPosition() method... with a common Vector3 position, to make our camera better aimed.
      camera.setPosition(new BABYLON.Vector3(0, 15, -30));
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
      var tableboxsize = 30;
      var table = BABYLON.Mesh.CreateBox("table", tableboxsize, scene);
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
      grid = BABYLON.Mesh.CreateGround("grid", 30, 30, 10, scene, false); //used to show grid
      grid.position.y = 0.02;
      grid.scaling.y = 0.001;
      grid.material = gridmat;
      
      //add cube
      cubeslist.length = 0;
      numcubes = 0;
      var p = -2;
      for(var i = 0; i < 5; i++){
        createCube({pos: new BABYLON.Vector3(-16,cubesize.s*2,(p+i)*2), scene: scene, size: 's', color: cubecolors[i], isVisible: false});
      }
      for(var i = 0; i < 5; i++){
        createCube({pos: new BABYLON.Vector3(17,cubesize.m*2,(p+i)*4), scene: scene, size: 'm', color: cubecolors[i], isVisible: false});
      }
      for(var i = 0; i < 5; i++){
        createCube({pos: new BABYLON.Vector3((p+i)*4,cubesize.l, 20), scene: scene, size: 'l', color: cubecolors[i], isVisible: false});
      }

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

    var textplane;
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
    };

    //**start app
    $scope.replaydata = [];
    var annotations = $meteorCollection(Annotations).subscribe('annotations');
    Meteor.subscribe("jobs", {
      onReady: function () {dataReady('jobs');},
      onError: function () { console.log("onError", arguments); }
    });
    Meteor.subscribe("annotations", {
      onReady: function () {dataReady('annotations');},
      onError: function () { console.log("onError", arguments); }
    });

    $scope.showTime = function(){
      return (new Date).getTime();
    };
    
    var readydat = [];
    var myannot, myjob;
    var dataReady = function(data){
      console.warn('ready ', data, (new Date).getTime());
      readydat.push(data);
      if(readydat.length > 2){
        if($stateParams.annotid){
          $scope.annotid = $stateParams.annotid;
          $scope.annot = $scope.findById(annotations, $scope.annotid);
          myannot = Annotations.findOne({_id: $scope.annotid});
          $scope.jobid = myannot.job;
          //must wait until Jobs are connected
          myjob = Jobs.findOne({_id: $scope.jobid});
          if(myjob){
            console.warn('myjob',$scope.jobid, myjob);
            $scope.myreplay = myjob;
            
            if($scope.myreplay.keyframes.length){
              var itKeyframes = function(idx, kfs, cb){
                if(_.isUndefined(kfs[idx])) return cb();
                console.warn(kfs[idx]);
                $scope.frameid = kfs[idx];
                showReplay(kfs[idx]);
                setTimeout(function(){
                  var doneDump = _.after($scope.renderviewdata.length, function(){
                    itKeyframes(idx+1, kfs, cb);
                  });
                  $scope.renderviewdata.forEach(function(r){
                    setTimeout(function(){
                      console.warn(kfs[idx]+'_'+r.name);
                      screenshotCanvas = document.getElementById(kfs[idx]+'_'+r.name);
                      camera.setPosition(r.campos);
                      //textUpdate(r.name, r.billb);
                      var sc = BABYLON.Tools.CreateScreenshot(engine, camera, {width: canvas.width, height: canvas.height});
                      doneDump();
                    },0);
                  });
                }, 0);
              };

              setTimeout(function(){
                itKeyframes(0, $scope.myreplay.keyframes, function(){
                  $('#renderCanvasBab').css('display', 'none');
                  $scope.$apply(function(){$rootScope.dataloaded = true;})
                })
              }, 700);
            }
            else toaster.pop('error', 'Game Missing Key Frames');
          }
        }
      }
    };

    $scope.resetWorld = function(){
      $scope.myreplay = null;
      camera.dispose();
      scene.dispose();
      engine.dispose();
      engine = null;
      camera = null;
      scene = null;
      createWorld();
    };

    $scope.findById = function(collection, id){
      return _.find(collection, function(a){return id === a._id});
    };

    $scope.addAnnot = function(frameid){
      console.warn('addAnnot', frameid);
      if($scope.annot){
        if(!$scope.annot.notes) $scope.annot.notes = {};
        if(!$scope.annot.notes[frameid]) $scope.annot.notes[frameid] = [];
        console.warn('obj',$scope.annot);
        if($scope.annot.notes[frameid].length){
          console.warn($scope.annot.notes[frameid][$scope.annot.notes[frameid].length-1].length);
          if(!$scope.annot.notes[frameid][$scope.annot.notes[frameid].length-1].length){
            toaster.pop('info', 'Fill in the Current Note');
            return;
          }
        }
        $scope.annot.notes[frameid].push('');
      }
      else toaster.pop('error', 'Missing Annotation','For id '+ $scope.annotid);
    };

    $scope.removeNote = function(frameid, idx){
      console.warn('rem note', frameid, idx, $scope.annot.notes[frameid]);
      $scope.annot.notes[frameid].splice(idx,1);
      console.warn('rem note', frameid, idx, $scope.annot.notes[frameid]);
    };
    
    $scope.submit = function(){
      var kflen = $scope.myreplay.keyframes.length;
      var len = Object.keys($scope.annot.notes).length;
      console.warn(kflen, len);
      if(kflen != len)
        toaster.pop('error', 'All Frames must have a Note');
      else{
        var isValid = true;
        _.each($scope.annot.notes, function(framenote, idx){
          if(!framenote[framenote.length - 1].length){
            //check for no text
            toaster.pop('error', 'Frame ' + idx, 'Please fill in the notes');
            isValid = false;
          } 
        });
        if(isValid){
          $scope.annot.submitted = new Date().getTime();
          toaster.pop('info', 'Description Annotations Submitted');
          //todo: submit should redirect to task view
        }
      }
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