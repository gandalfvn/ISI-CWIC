/**========================================================
 * Module: world-view.js
 * Created by wjwong on 7/27/15.
 =========================================================*/

angular.module('angle').controller('worldSimpCtrl',
  ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout',
   function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout){
     "use strict";

     // Get the canvas element from our HTML above
     var canvas = document.getElementById("renderCanvasBab");
     // Load the BABYLON 3D engine
     var engine = new BABYLON.Engine(canvas);

     var numcubes = 0;
     var cubecolors = ['red', 'yellow', 'cyan', 'purple', 'green', 'orange'];
     var colorids = {};
     colorids['red'] = (new BABYLON.Color3.FromInts(247,200,8));
     colorids['yellow'] = (new BABYLON.Color3.FromInts(34,181,191));
     colorids['cyan'] = (new BABYLON.Color3.FromInts(135,103,166));
     colorids['purple'] = (new BABYLON.Color3.FromInts(136,193,52));
     colorids['green'] = (new BABYLON.Color3.FromInts(210,49,93));
     colorids['orange'] = (new BABYLON.Color3.FromInts(233,136,19));
     //['#d2315d', '#f7c808', '#22b5bf', '#8767a6', '#88c134', '#e98813'];
     var cubesize = {
       s: 1,
       m: 2,
       l: 3
     };

     // This begins the creation of a function that we will 'call' just after it's built
     var createScene = function () {
       var cubeslist = [];
       // Now create a basic Babylon Scene object
       var scene = new BABYLON.Scene(engine);
       scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.OimoJSPlugin());
       // Change the scene background color to green.
       scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
       scene.collisionsEnabled = true;
       scene.workerCollisions = true;
       
       // This creates and positions a free camera
       var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -30), scene);
       // This targets the camera to scene origin
       camera.setTarget(BABYLON.Vector3.Zero());
       // This attaches the camera to the canvas
       //camera.attachControl(canvas, true);
       camera.speed = 1;
       camera.ellipsoid = new BABYLON.Vector3(1, 1, 1); //bounding ellipse
       camera.checkCollisions = true;
       
       scene.activeCamera = camera;
       scene.activeCamera.attachControl(canvas, true);

       // This creates a light, aiming 0,1,0 - to the sky.
       var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
       // Dim the light a small amount
       light.intensity = 0.7;
       // this creates dir. light
       var dirlight = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-0.4, -2, -0.4), scene);
       // Dim the light a small amount
       dirlight.intensity = 0.6;
       dirlight.position = new BABYLON.Vector3(0, 40, 0);
       
       /** GROUND **/
       // Material
       var mat = new BABYLON.StandardMaterial("ground", scene);
       mat.diffuseColor = new BABYLON.Color3.Gray();
       // Object
       var ground = BABYLON.Mesh.CreateBox("ground", 100, scene);
       ground.position.y = -10;
       ground.scaling.y = 0.01;
       ground.material = mat; //gridshader; //mat;
       ground.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});
       ground.checkCollisions = true;
       ground.receiveShadows = true;
       
       
       //add cube
       var objname = "cube1";
       var boxsize = 1;
       var boxcolor = new BABYLON.Color3.FromInts(34,181,191);
       console.warn(objname);
       var boxmat = new BABYLON.StandardMaterial(objname, scene);
       boxmat.diffuseColor = boxcolor;
       // Let's try our built-in 'sphere' shape. Params: name, subdivisions, size, scene
       var box = BABYLON.Mesh.CreateBox(objname, boxsize, scene);
       box.position = new BABYLON.Vector3(0,5,0);
       box.visibility = 1;
       box.material = boxmat;
       box.showBoundingBox = true;
       box.checkCollisions = true;
       var halfelip = boxsize/3;
       box.ellipsoid = new BABYLON.Vector3(halfelip, halfelip, halfelip);
       box.ellipsoidOffset = new BABYLON.Vector3(0, 0.1, 0);
       box.applyGravity = true;
       box.receiveShadows = true;
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
       cubeslist.push(box);

       //shadows
       var shadowGenerator = new BABYLON.ShadowGenerator(1024, dirlight);
       cubeslist.forEach(function(c){
         shadowGenerator.getShadowMap().renderList.push(c);
       });
       shadowGenerator.usePoissonSampling = true;
       
       //handle drag and drop
       var startingPoint;
       var currentMesh;
       var lockxz = false;
       var sceney = null;

       var getGroundPosition = function () {
         // Use a predicate to get position on the ground
         var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
         if (pickinfo.hit) {
           if(startingPoint){
             var current = pickinfo.pickedPoint.clone();
             current.y = startingPoint.y;
             return current;
           }
           else return pickinfo.pickedPoint;
         }
         return null;
       }
       
       var onPointerDown = function (evt) {
         if (evt.button !== 0) return;
         // check if we are under a mesh
         var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
           return (mesh !== ground)});
         if (pickInfo.hit) {
           currentMesh = pickInfo.pickedMesh;
           currentMesh.position.addInPlace(new BABYLON.Vector3(0,0.1,0));
           startingPoint = currentMesh.position; //getGroundPosition(evt);
           sceney = scene.pointerY;

           if (startingPoint) { // we need to disconnect camera from canvas
             setTimeout(function () {
               camera.detachControl(canvas);
             }, 0);
           }
         }
       }

       var onPointerUp = function () {
         if (startingPoint) {
           camera.attachControl(canvas, true);
           startingPoint = null;
           currentMesh.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
           return;
         }
       }

       var onPointerMove = function (evt) {
         if (!startingPoint || !sceney) return;
         var delta;
         delta = (sceney - scene.pointerY);
         if (!delta) {
           return;
         }
         var diff;
         diff = new BABYLON.Vector3(0, delta, 0);
         currentMesh.moveWithCollisions(diff);
         //currentMesh.position.addInPlace(diff);

         if(currentMesh.intersectsMesh(ground, true)){
           currentMesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
         }
         else{
           currentMesh.material.emissiveColor = new BABYLON.Color3.Black();
         }
         sceney = scene.pointerY;
         startingPoint = currentMesh.position;
       }

       //require hand.js from ms
       canvas.addEventListener("pointerdown", onPointerDown, false);
       canvas.addEventListener("pointerup", onPointerUp, false);
       canvas.addEventListener("pointermove", onPointerMove, false);

       scene.onDispose = function () {
         canvas.removeEventListener("pointerdown", onPointerDown);
         canvas.removeEventListener("pointerup", onPointerUp);
         canvas.removeEventListener("pointermove", onPointerMove);
       }

       // Leave this function
       return scene;
     };  // End of createScene function
     
     // Now, call the createScene function that you just finished creating
     var scene = createScene();

     // Register a render loop to repeatedly render the scene
     engine.runRenderLoop(function () {
       scene.render();
     });

     // Watch for browser/canvas resize events
     window.addEventListener("resize", function () {
       engine.resize();
     });

   }])