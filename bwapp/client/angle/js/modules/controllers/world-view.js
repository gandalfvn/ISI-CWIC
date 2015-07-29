/**========================================================
 * Module: world-view.js
 * Created by wjwong on 7/27/15.
 =========================================================*/

angular.module('angle').controller('worldCtrl',
  ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout',
   function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout){
     "use strict";

     // Get the canvas element from our HTML above
     var canvas = document.getElementById("renderCanvasBab");
     // Load the BABYLON 3D engine
     var engine = new BABYLON.Engine(canvas);

     var cubeslist = [];
     var numcubes = 0;
     var cubecolors = [];
     cubecolors.push(new BABYLON.Color3.FromInts(210,49,93));
     cubecolors.push(new BABYLON.Color3.FromInts(247,200,8));
     cubecolors.push(new BABYLON.Color3.FromInts(34,181,191));
     cubecolors.push(new BABYLON.Color3.FromInts(135,103,166));
     cubecolors.push(new BABYLON.Color3.FromInts(136,193,52));
     cubecolors.push(new BABYLON.Color3.FromInts(233,136,19));
     //['#d2315d', '#f7c808', '#22b5bf', '#8767a6', '#88c134', '#e98813'];
     var cubeSize = {
       s: 1,
       m: 2,
       l: 3
     };

     var createCube = function(data){
       var objname = "cube"+numcubes;
       var boxmat = new BABYLON.StandardMaterial(objname, data.scene);
       /*var boxt = new BABYLON.Texture("img/textures/wood.jpg", scene);
       boxt.uScale = boxt.vScale = 1;
       boxmat.diffuseTexture = boxt;
       boxmat.specularColor = BABYLON.Color3.Black();*/
       boxmat.diffuseColor = data.color;
       // Let's try our built-in 'sphere' shape. Params: name, subdivisions, size, scene
       var box = BABYLON.Mesh.CreateBox(objname, data.size, data.scene);
       //box.position.y = 5;
       box.position = data.pos;
       box.visibility = 1;
       box.material = boxmat;
       //box.showBoundingBox = true;
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
       box.checkCollisions = true;
       var halfelip = data.size/2;
       box.ellipsoid = new BABYLON.Vector3(halfelip, halfelip, halfelip);
       box.applyGravity = true;
       numcubes++;
       cubeslist.push(box);
     }

     // This begins the creation of a function that we will 'call' just after it's built
     var createScene = function () {
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
       light.intensity = 0.9;

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
       var t = new BABYLON.Texture("img/textures/plasticwhite.jpg", scene);
       t.uScale = t.vScale = 10;
       mat.diffuseTexture = t;
       mat.specularColor = BABYLON.Color3.Black();
       var gridshader = new BABYLON.ShaderMaterial("grid", scene, "grid", {});

       // Object
       var ground = BABYLON.Mesh.CreateBox("ground", 100, scene);
       ground.position.y = -10;
       ground.scaling.y = 0.01;

       ground.material = mat; //gridshader; //mat;
       ground.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});
       ground.checkCollisions = true;

       // Impact impostor
       var impact = BABYLON.Mesh.CreatePlane("impact", 0.5, scene);
       impact.material = new BABYLON.StandardMaterial("impactMat", scene);
       impact.material.diffuseTexture = new BABYLON.Texture("img/textures/target.png", scene);
       impact.material.diffuseTexture.hasAlpha = true;
       impact.position = new BABYLON.Vector3(0, 0, -0.1);
       
       //add cube
       for(var i = 0; i < 5; i++){
         createCube({pos: new BABYLON.Vector3(i*2,5,0), scene: scene, size: cubeSize.s, color: cubecolors[i]});
       }
       for(var i = 0; i < 5; i++){
         createCube({pos: new BABYLON.Vector3(i*3,5,3), scene: scene, size: cubeSize.m, color: cubecolors[i]});
       }
       for(var i = 0; i < 5; i++){
         createCube({pos: new BABYLON.Vector3(i*6,5,8), scene: scene, size: cubeSize.l, color: cubecolors[i]});
       }

       //handle drag and drop
       var startingPoint;
       var currentMesh;
       var yplane;
       var lockxz = false;

       var getGroundPosition = function () {
         // Use a predicate to get position on the ground
         var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
         if (pickinfo.hit) {
           return pickinfo.pickedPoint;
         }
         return null;
       }

       var getYPosition = function () {
         // Use a predicate to get position on the ground
         var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == yplane; });
         if (pickinfo.hit) {
           return pickinfo.pickedPoint;
         }
         return null;
       }

       var onPointerDown = function (evt) {
         if (evt.button !== 0) return;
         // check if we are under a mesh
         var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
           return (mesh !== ground) && (mesh !== skybox) && (mesh !== yplane); });
         if (pickInfo.hit) {
           currentMesh = pickInfo.pickedMesh;
           startingPoint = getGroundPosition(evt);

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
         if (!startingPoint) return;
         var current;
         if(!lockxz)
           current = getGroundPosition(evt);
         else{
           current = getYPosition(evt);
           console.warn('loc ', current)
         }
         if (!current) {
           return;
         }
         var diff = current.subtract(startingPoint);
         //currentMesh.position.addInPlace(diff);
         currentMesh.moveWithCollisions(diff);
         startingPoint = current;
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


       window.addEventListener("keydown", function (evt) {
         console.warn(evt.keyCode);
         switch (evt.keyCode) {
           case 16:
             if(currentMesh){
               console.warn('shift down', camera.position);
               lockxz = true;
               //yplane
               yplane = BABYLON.Mesh.CreatePlane("yplane", 100.0, scene, false);
               yplane.material = new BABYLON.StandardMaterial("yplanemat", scene);
               yplane.material.emissiveColor = new BABYLON.Color3(0.5, 1, 0.5);
               yplane.position.x = currentMesh.position.x;
               yplane.position.y = currentMesh.position.y;
               yplane.position.z = currentMesh.position.z;
               //yplane.material.backFaceCulling = false;
               //yplane.rotation = new BABYLON.Vector3(Math.PI, 0, 0);
             }
             break;
           default: break;
         }
       });

       window.addEventListener("keyup", function (evt) {
         console.warn(evt.keyCode);
         switch (evt.keyCode) {
           case 16:
             if(yplane){
               yplane.dispose();
               yplane = null;
               console.warn('shift up')
             }
             lockxz = false;
             break;
           default: break;
         }
       });

       var animate = function(){
         if(yplane){
           yplane.lookAt(camera.position);
         }
       }
       scene.registerBeforeRender(animate);
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