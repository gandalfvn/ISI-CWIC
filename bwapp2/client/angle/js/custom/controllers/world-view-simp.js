/**========================================================
 * Module: world-view.js
 * Created by wjwong on 7/27/15.
 * http://www.babylonjs-playground.com/#BTHKN
 =========================================================*/

angular.module('angle').controller('worldSimpCtrl',
  ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout',
   function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout){
     "use strict";

     //*****draw axis
     var canvas2D = document.getElementById("canvas_2D");
     var context2D = canvas2D.getContext("2d");

     //Add a placeholder function for browsers that don't have setLineDash()
     if (!context2D.setLineDash) {
       context.setLineDash = function () {}
     }

     var clearCanvas2D = function(){
       canvas2D.width = window.innerWidth;
       canvas2D.height = window.innerHeight;
     };

     var drawAxis = function(camera, mesh, drawAncestors, pivot){

       context2D.lineWidth = 1;
       context2D.shadowColor = '#000000';
       context2D.lineCap = "square";
       context2D.shadowBlur = 10;
       context2D.shadowOffsetX = 0;
       context2D.shadowOffsetY = 0;

       //////////////////////// update camera view matrix
       var viewMatrix = camera.getViewMatrix();
       //////////////////////////

       var originInLocalSpace = BABYLON.Vector3.Zero();
       var xInLocalSpace = new BABYLON.Vector3(1,0,0);
       var yInLocalSpace = new BABYLON.Vector3(0,1,0);
       var zInLocalSpace = new BABYLON.Vector3(0,0,1);

       var cameraPositionInLocalSpace = camera.position.clone();

       // todo: case where camera has a parent

       var worldMatrix;
       var invWorldMatrix;
       if(mesh)
       {
         worldMatrix = mesh.getWorldMatrix();
         invWorldMatrix = worldMatrix.clone();
         invWorldMatrix.invert();
         cameraPositionInLocalSpace = BABYLON.Vector3.TransformCoordinates(cameraPositionInLocalSpace, invWorldMatrix);
       }

       var dist = originInLocalSpace.subtract(cameraPositionInLocalSpace);
       dist.normalize();
       var startInLocalSpace = dist.scale(15).add(cameraPositionInLocalSpace); // todo: use const for 15

       var startLine = _drawAxis(startInLocalSpace, xInLocalSpace, "#ff0000", camera, worldMatrix, mesh);
       _drawAxis(startInLocalSpace, yInLocalSpace, "#00ff00", camera, worldMatrix, mesh);
       _drawAxis(startInLocalSpace, zInLocalSpace, "#0000ff", camera, worldMatrix, mesh);

       if (drawAncestors && mesh) {
         var endLine = drawAxis(camera, mesh.parent, drawAncestors, pivot);
         context2D.setLineDash([3,9]);
         context2D.shadowBlur = 2;
         drawLine(startLine, endLine, "#ffffff");
         context2D.shadowBlur = 10;
         context2D.setLineDash([0]);
       }

       if(mesh && pivot)
       {
         var parentWorldMatrix = mesh.parent ? mesh.parent.getWorldMatrix() : BABYLON.Matrix.Identity();
         var pivotWorldMatrix =  mesh._localScaling.multiply(mesh._localRotation).multiply (mesh._localTranslation).multiply(parentWorldMatrix);

         var invPivotWorldMatrix = pivotWorldMatrix.clone();
         invPivotWorldMatrix.invert();
         var cameraPositionInPivotSpace = BABYLON.Vector3.TransformCoordinates(camera.position, invPivotWorldMatrix);

         var dist = originInLocalSpace.subtract(cameraPositionInPivotSpace);
         dist.normalize();
         startInLocalSpace = dist.scale(30).add(cameraPositionInPivotSpace); // todo: use const for 30

         _drawAxis(startInLocalSpace, xInLocalSpace, "#ff8888", camera, pivotWorldMatrix, mesh);
         _drawAxis(startInLocalSpace, yInLocalSpace, "#88ff88", camera, pivotWorldMatrix, mesh);
         _drawAxis(startInLocalSpace, zInLocalSpace, "#8888ff", camera, pivotWorldMatrix, mesh);
       }

       return startLine;
     };

     var _drawAxis = function (startInLocalSpace, axisInLocalSpace, color, camera, worldMatrix, mesh) {

       var endInLocalSpace = startInLocalSpace.add(axisInLocalSpace);

       var startInWorld = startInLocalSpace.clone();
       var endInWorld = endInLocalSpace.clone();

       if (mesh)
       {
         startInWorld = BABYLON.Vector3.TransformCoordinates(startInWorld, worldMatrix);
         endInWorld = BABYLON.Vector3.TransformCoordinates(endInWorld, worldMatrix);
       }

       var v = _startEndLine(startInWorld, endInWorld, camera);

       var startVectorInView = v.start;
       if (!startVectorInView) return;
       var endVectorInView = v.end;

       var cW = canvas.width;
       var cH = canvas.height;

       var projectionMatrix = camera.getProjectionMatrix();

       var startLine = BABYLON.Vector3.TransformCoordinates(startVectorInView, projectionMatrix);
       startLine = new BABYLON.Vector2((startLine.x + 1) * (cW / 2), (1 - startLine.y) * (cH / 2));

       var endLine = BABYLON.Vector3.TransformCoordinates(endVectorInView, projectionMatrix);
       endLine = new BABYLON.Vector2((endLine.x + 1) * (cW / 2), (1 - endLine.y) * (cH / 2));

       drawLine(startLine, endLine, color);

       return startLine;
     }

     var _startEndLine = function (startVector, endVector, camera) {

       var res = {};

       var viewMatrix = camera.getViewMatrix();

       var pointOfPlane = new BABYLON.Vector3(0,0,camera.minZ);
       var normalOfPlane = new BABYLON.Vector3(0,0,1);

       var startVectorInView = BABYLON.Vector3.TransformCoordinates(startVector, viewMatrix);
       var endVectorInView = BABYLON.Vector3.TransformCoordinates(endVector, viewMatrix);

       if (startVectorInView.z < 0 && endVectorInView.z < 0) {
         return res;
       }

       var startLine;
       var endLine;

       if (startVectorInView.z >=0 && endVectorInView.z >= 0) {
         res.start = startVectorInView;
         res.end = endVectorInView;
         return res;
       }

       if (startVectorInView.z < 0) {
         startVectorInView = _intersectionPoint(startVectorInView, endVectorInView, pointOfPlane, normalOfPlane);
       }
       else {
         endVectorInView = _intersectionPoint(startVectorInView, endVectorInView, pointOfPlane, normalOfPlane);
       }

       res.start = startVectorInView;
       res.end = endVectorInView;

       return res;
     };

// inspiration from Blender
     var _intersectionPoint = function(p0, p1, pointOfPlane, normalOfPlane) {
       /*
        p0, p1: define the line
        pointOfPlane, normalOfPlane: define the plane:
        pointOfPlane is a point on the plane (plane coordinate).
        normalOfPlane is a normal vector defining the plane direction; does not need to be normalized.

        return a Vector or None (when the intersection can't be found).
        */

       var u = p1.subtract(p0);
       var w = p0.subtract(pointOfPlane);
       var dot = BABYLON.Vector3.Dot(normalOfPlane, u);

       if (Math.abs(dot) > 0.000001) {
         // the factor of the point between p0 -> p1 (0 - 1)
         // if 'fac' is between (0 - 1) the point intersects with the segment.
         // otherwise:
         //  < 0.0: behind p0.
         //  > 1.0: infront of p1.
         var fac = -BABYLON.Vector3.Dot(normalOfPlane, w) / dot;
         u = u.scale(fac);
         return p0.add(u);
       }
       else {
         // The segment is parallel to plane
         return undefined;
       }
     };

     var drawLine = function(startPosition, endPosition, color){
       var prevStrokeStyle = context2D.strokeStyle;
       context2D.strokeStyle= color;
       context2D.beginPath();
       context2D.moveTo(startPosition.x, startPosition.y);
       context2D.lineTo(endPosition.x, endPosition.y);
       context2D.stroke();
       context2D.strokeStyle= prevStrokeStyle;
     };
     //*****end draw axis     

     // Get the canvas element from our HTML above
     var canvas = document.getElementById("renderCanvasBab");
     // Load the BABYLON 3D engine
     var engine = new BABYLON.Engine(canvas);

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
     var cubeslist = [];
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
       camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -30), scene);
       // This targets the camera to scene origin
       camera.setTarget(BABYLON.Vector3.Zero());
       // This attaches the camera to the canvas
       //camera.attachControl(canvas, true);
       camera.speed = 1;
       camera.ellipsoid = new BABYLON.Vector3(1, 1, 1); //bounding ellipse
       camera.checkCollisions = true;
       camera.keysUp = [87]; // w
       camera.keysDown = [83]; // s
       camera.keysLeft = [65]; //  a
       camera.keysRight = [68]; // d
       
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
       console.warn(objname);
       var boxmat = new BABYLON.StandardMaterial(objname, scene);
       boxmat.diffuseColor = colorids.cyan;
       // Let's try our built-in 'sphere' shape. Params: name, subdivisions, size, scene
       var box = BABYLON.Mesh.CreateBox(objname, boxsize, scene);
       box.position = new BABYLON.Vector3(0,5,0);
       box.visibility = 1;
       box.material = boxmat;
       box.showBoundingBox = false;
       box.checkCollisions = true;
       var halfelip = boxsize/2;
       box.ellipsoid = new BABYLON.Vector3(halfelip, halfelip, halfelip);
       //box.ellipsoidOffset = new BABYLON.Vector3(0, 0.1, 0);
       box.applyGravity = true;
       //box.rotation.y = Math.PI/4;
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
       cubeslist.push(box);

       objname = "cube2";
       boxsize = 2;
       boxmat = new BABYLON.StandardMaterial(objname, scene);
       boxmat.diffuseColor = colorids.orange;
       box = BABYLON.Mesh.CreateBox(objname, boxsize, scene);
       box.position = new BABYLON.Vector3(3,5,0);
       box.visibility = 1;
       box.material = boxmat;
       box.showBoundingBox = false;
       box.checkCollisions = true;
       var halfelip = boxsize/2;
       box.ellipsoid = new BABYLON.Vector3(halfelip, halfelip, halfelip);
       //box.ellipsoidOffset = new BABYLON.Vector3(0, 0.1, 0);
       box.applyGravity = true;
       box.rotation.y = Math.PI/4;
       box.rotation.x = Math.PI/2;
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
       var pointerxy;
       var currentMesh;
       var lockxz = false;
       var sceney = null;

       var getGroundPosition = function(){
         if(false){
           // Use a predicate to get position on the ground
           var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
           if(pickinfo.hit) {
             if(startingPoint){
               var current = pickinfo.pickedPoint.clone();
               current.y = startingPoint.y;
               //move by step n
               current.x = Number(( Math.round(current.x * 10) / 10).toFixed(2));
               current.z = Number(( Math.round(current.z * 10) / 10).toFixed(2));
               return current;
             }
             else return pickinfo.pickedPoint;
           }
         }
         else{
           if(startingPoint){
             var current = startingPoint.clone();
             //get by mouse position instead of ground so no warping of objects.
             var speed = 0.16;
             var pos = new BABYLON.Vector2(startingPoint.x + (scene.pointerX - pointerxy.x)*speed, startingPoint.z + (pointerxy.y - scene.pointerY)*speed);
             current.x = Number(( Math.round(pos.x * 10) / 10).toFixed(2));
             current.z = Number(( Math.round(pos.y * 10) / 10).toFixed(2));
             pointerxy.x = scene.pointerX;
             pointerxy.y = scene.pointerY;
             return current;
           }
           else console.warn('missing starting point');
         }
         return null;
       };
       
       var onPointerDown = function (evt) {
         if (evt.button !== 0) return;
         // check if we are under a mesh
         var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
           return (mesh !== ground)});
         if (pickInfo.hit) {
           currentMesh = pickInfo.pickedMesh;
           currentMesh.position.addInPlace(new BABYLON.Vector3(0,0.3,0));
           startingPoint = currentMesh.position; //getGroundPosition(evt);
           pointerxy = new BABYLON.Vector2(scene.pointerX, scene.pointerY);
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

         var diff;
         diff = current.subtract(startingPoint);
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

       window.addEventListener("keydown", function (evt) {
         switch (evt.keyCode) {
           case 16:
             if(currentMesh){
               lockxz = true;
               sceney = scene.pointerY;
             }
             break;
           default: break;
         }
       });

       window.addEventListener("keyup", function (evt) {
         switch (evt.keyCode) {
           case 16:
             lockxz = false;
             sceney = null;
             break;
           default: break;
         }
       });

       // Leave this function
       return scene;
     };  // End of createScene function
     
     // Now, call the createScene function that you just finished creating
     var scene = createScene();

     // Register a render loop to repeatedly render the scene
     engine.runRenderLoop(function () {
       scene.render();
       // 2D
       if(true){
         clearCanvas2D();
         cubeslist.forEach(function(c){
           drawAxis(camera, c, true, true);
         })
       }
     });

     // Watch for browser/canvas resize events
     window.addEventListener("resize", function () {
       engine.resize();
     });

   }])