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

     var createCube = function(data){
       var objname = "cube_"+ data.size + '_' + data.color + '_' +numcubes;
       var boxsize = cubesize[data.size];
       var boxcolor = colorids[data.color];
       console.warn(objname);
       var boxmat = new BABYLON.StandardMaterial(objname, data.scene);
       /*var boxt = new BABYLON.Texture("img/textures/wood.jpg", scene);
       boxt.uScale = boxt.vScale = 1;
       boxmat.diffuseTexture = boxt;
       boxmat.specularColor = BABYLON.Color3.Black();*/
       boxmat.diffuseColor = boxcolor;
       //boxmat.alpha = 0.7;
       var box = BABYLON.Mesh.CreateBox(objname, boxsize, data.scene);
       //box.position.y = 5;
       box.position = data.pos;
       box.visibility = 1;
       box.material = boxmat;
       box.showBoundingBox = false;
       box.checkCollisions = true;
       var elipbox = boxsize/2.1;
       box.ellipsoid = new BABYLON.Vector3(elipbox, elipbox, elipbox);
       //box.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0);
       box.applyGravity = true;
       box.receiveShadows = true;
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
       box.onCollide = function(a){
         console.warn('oncollide', objname, this, a)
       }
       //box.updatePhysicsBodyPosition();
       box.refreshBoundingInfo();
       //box.moveWithCollisions(new BABYLON.Vector3(-1, 0, 0));
       numcubes++;
       cubeslist.push(box);
     }

     var createVolumeShadow = function(mesh, scene){
       var volumeMesh;
       var statlist = mesh.name.split('_');
       var sizet = statlist[1]; 
       var objname = "vol_"+ sizet;
       var boxsize = cubesize[sizet];
       var boxcolor = new BABYLON.Color3.Gray();
       var volmat = new BABYLON.StandardMaterial(objname, scene);
       volmat.alpha = 0.3;
       volmat.diffuseColor = boxcolor;
       volumeMesh = BABYLON.Mesh.CreateBox(objname, boxsize, scene);
       volumeMesh.material = volmat;
       volumeMesh.scaling.y = 40;
       volumeMesh.isPickable = false;
       volumeMesh.showBoundingBox = false;
       volumeMesh.checkCollisions = false;
       volumeMesh.applyGravity = false;
       volumeMesh.receiveShadows = false;
       volumeMesh.position = mesh.position.clone();
       return volumeMesh;
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
       light.intensity = 0.7;
       // this creates dir. light for shadows
       var dirlight = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-0.4, -2, -0.4), scene);
       // Dim the light a small amount
       dirlight.intensity = 0.6;
       dirlight.position = new BABYLON.Vector3(0, 40, 0);
       
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
       ground.ellipsoid = new BABYLON.Vector3(0.5, 0.1, 0.5);
       ground.position.y = -10;
       ground.scaling.y = 0.01;
       ground.onCollide = function(a,b){
         console.warn('oncollide ground', a, b)
       }

       ground.material = mat; //gridshader; //mat;
       ground.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});
       ground.checkCollisions = true;
       ground.receiveShadows = true;
       
       //add cube
       var p = -2;
       for(var i = 0; i < 5; i++){
         createCube({pos: new BABYLON.Vector3((p+i)*2,5,0), scene: scene, size: 's', color: cubecolors[i]});
       }
       for(var i = 0; i < 5; i++){
         createCube({pos: new BABYLON.Vector3((p+i)*3,5,3), scene: scene, size: 'm', color: cubecolors[i]});
       }
       for(var i = 0; i < 5; i++){
         createCube({pos: new BABYLON.Vector3((p+i)*6,5,8), scene: scene, size: 'l', color: cubecolors[i]});
       }

       //shadows
       /*var shadowGenerator = new BABYLON.ShadowGenerator(1024, dirlight);
       cubeslist.forEach(function(c){
         shadowGenerator.getShadowMap().renderList.push(c);
       });
       //shadowGenerator.useVarianceShadowMap = true;
       shadowGenerator.usePoissonSampling = true;*/
       
       //handle drag and drop
       var startingPoint;
       var currentMesh;
       var volumeMesh;
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
           return (mesh !== ground) && (mesh !== skybox) && (mesh !== volumeMesh)});
         if (pickInfo.hit) {
           currentMesh = pickInfo.pickedMesh;
           if(volumeMesh) volumeMesh.dispose();
           volumeMesh = createVolumeShadow(currentMesh, scene);
           //determine position to move to improve bouding box;
           var vectorsWorld = currentMesh.getBoundingInfo().boundingBox.vectorsWorld; // summits of the bounding box
           var d = vectorsWorld[1].subtract(vectorsWorld[0]).length(); // distance between summit 0 and summit 1
           currentMesh.position.addInPlace(new BABYLON.Vector3(0,d*0.3,0));
           currentMesh.refreshBoundingInfo();
           startingPoint = pickInfo.pickedMesh.position;//getGroundPosition(evt);

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
           sceney = null;
           if(volumeMesh) volumeMesh.dispose();
           volumeMesh = null;
           currentMesh.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
           return;
         }
       }

       var onPointerMove = function (evt) {
         if (!startingPoint) return;
         var current;
         var delta;
         if(lockxz){
           current = startingPoint.clone();
           delta = (sceney - scene.pointerY) * 0.2;
           current.y += delta;
           sceney = scene.pointerY;
         }
         else
           current = getGroundPosition(evt);
         if (!current) {
           return;
         }
         
         var diff;
         diff = current.subtract(startingPoint);
         currentMesh.moveWithCollisions(diff);
         currentMesh.refreshBoundingInfo();
         volumeMesh.position = currentMesh.position.clone();
         //currentMesh.position.addInPlace(diff);

         /*cubeslist.forEach(function(c){
           if(currentMesh.intersectsMesh(c, true)){
             currentMesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
           }
           else{
             currentMesh.material.emissiveColor = new BABYLON.Color3.Black();
           }
         })*/

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
           case 87:
             if(currentMesh){
               
             }
             break;
           case 16:
             if(currentMesh){
               lockxz = true;
               sceney = scene.pointerY;
               //yplane
               /*yplane = currentMesh.clone(currentMesh.name);
               yplane.material = new BABYLON.StandardMaterial("yplanemat", scene);
               yplane.material.emissiveColor = new BABYLON.Color3(0.5, 1, 0.5);
               yplane.position.x = currentMesh.position.x;
               yplane.position.y = currentMesh.position.y;
               yplane.position.z = currentMesh.position.z;
               //yplane.material.backFaceCulling = false;
               //yplane.rotation = new BABYLON.Vector3(Math.PI, 0, 0);*/
             }
             break;
           default: break;
         }
       });

       window.addEventListener("keyup", function (evt) {
         console.warn(evt.keyCode);
         switch (evt.keyCode) {
           case 16:
             /*if(yplane){
               yplane.dispose();
               yplane = null;
               console.warn('shift up')
             }*/
             lockxz = false;
             sceney = null;
             break;
           default: break;
         }
       });

       var animate = function(){
         /*if(currentMesh){
           var rayPick = new BABYLON.Ray(currentMesh.position, new BABYLON.Vector3(0, -1, 0));
           var meshFound = scene.pickWithRay(rayPick, function(item){
             return item != currentMesh;
           });

           if(meshFound.distance > 1.1 || true){
             var path = BABYLON.Mesh.CreateLines("lines", [
               currentMesh.position,
               meshFound.pickedPoint
             ], scene);
             path.color = new BABYLON.Color3(1, 0, 0);
           }
         }*/
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