/**========================================================
 * Module: world-view.js
 * Created by wjwong on 7/27/15.
 =========================================================*/

angular.module('angle').controller('worldCtrl',
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
       var startInLocalSpace = dist.scale(30).add(cameraPositionInLocalSpace); // todo: use const for 15
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
     var camera;
     
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
       //boxmat.alpha = 0.8;
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
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:boxsize, friction:0.5, restitution:0.1});
       box.onCollide = function(a){
         //console.warn('oncollide', objname, this, a)
       }
       //box.updatePhysicsBodyPosition();
       //box.refreshBoundingInfo();
       //box.moveWithCollisions(new BABYLON.Vector3(-1, 0, 0));
       numcubes++;
       cubeslist.push(box);
     }

     /**
      * provide a quaternion and will return the current letter of up axis
      * @param quat
      */
     var findUpAxis = function(quat){
       var qm = new BABYLON.Matrix.Identity();
       quat.toRotationMatrix(qm);
       var axis = ['x','y','z'];
       var vect = [new BABYLON.Vector3(1,0,0), new BABYLON.Vector3(0,1,0), new BABYLON.Vector3(0,0,1)];
       var maxmag = 0, idx = -1;
       vect.forEach(function(v, i){
         var mag = Math.abs(BABYLON.Vector3.Dot(vect[1], BABYLON.Vector3.TransformCoordinates(v, qm)));
         if(mag > maxmag){
           maxmag = mag;
           idx = i;
         }
       })
       return axis[idx];
     }

     /**
      * Recieves a mesh cube to create volume from
      * Sceen to attach
      * Determine if its a collider volume mesh to create
      * @param mesh
      * @param scene
      * @param isCollider
      * @returns {*}
      */
     var createVolumeShadow = function(mesh, scene, isCollider){
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
       volumeMesh.rotationQuaternion = mesh.rotationQuaternion.clone();
       var upaxis = findUpAxis(mesh.rotationQuaternion);
       console.warn('vm', volumeMesh);
       volumeMesh.material = volmat;
       if(isCollider) volumeMesh.scaling[upaxis] = 40;
       else volumeMesh.scaling[upaxis] = 60;
       volumeMesh.isPickable = false;
       volumeMesh.showBoundingBox = false;
       volumeMesh.checkCollisions = false;
       volumeMesh.applyGravity = false;
       volumeMesh.receiveShadows = false;
       volumeMesh.position = mesh.position.clone();
       if(isCollider){
         volumeMesh.material.alpha = 0.3;
         volumeMesh.material.diffuseColor = new BABYLON.Color3.Green();
         volumeMesh.bakeTransformIntoVertices(volumeMesh.getWorldMatrix(true)); //pretransform the vertices so we can get the actual bounds
         var vectorsWorld = volumeMesh.getBoundingInfo().boundingBox.vectorsWorld; // 
         var miny, maxy;
         vectorsWorld.forEach(function(v){
           if(v.y < miny || !miny) miny = v.y;
           if(v.y > maxy || !maxy) maxy = v.y;
         })
         volumeMesh.position.addInPlace(new BABYLON.Vector3(0, (maxy-miny)/2, 0));

         /*var matPlan = new BABYLON.StandardMaterial("matPlan1", scene);
         matPlan.backFaceCulling = false;
         matPlan.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);
         var pointToIntersect = new BABYLON.Vector3(-30, 0, 0);
         var origin = BABYLON.Mesh.CreateSphere("origin", 4, 0.3, scene);
         origin.position = volumeMesh.position.clone();
         origin.material = matPlan;*/
       }
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
       var groupMesh = [];
       var volumeMesh;
       var intersetMesh;
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
           return (mesh !== ground) && (mesh !== skybox) && (mesh !== volumeMesh) 
             && (mesh !== intersetMesh)});
         if (pickInfo.hit) {
           currentMesh = pickInfo.pickedMesh;
           if(intersetMesh) intersetMesh.dispose();
           intersetMesh = createVolumeShadow(currentMesh, scene, true);
           if(volumeMesh) volumeMesh.dispose();
           volumeMesh = createVolumeShadow(currentMesh, scene);
           console.warn(currentMesh);
           setTimeout(function () {
             //if(currentMesh.position.y < -8)
             {//only move cube off ground
               console.warn('bm',groupMesh);
               var vectorsWorld = currentMesh.getBoundingInfo().boundingBox.vectorsWorld; // summits of the bounding box
               //determine position to move to improve bouding box;
               var d = vectorsWorld[1].subtract(vectorsWorld[0]).length(); // distance between summit 0 and summit 1
               var diff = new BABYLON.Vector3(0, d*0.4, 0);
               currentMesh.position.addInPlace(diff);
               if(groupMesh.length){
                 groupMesh.forEach(function(m){
                   m.position.addInPlace(diff);
                 })
               }
             }
           }, 10);
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
           if(intersetMesh) intersetMesh.dispose();
           intersetMesh = null;
           if(groupMesh)
             groupMesh.forEach(function(c){
               c.material.emissiveColor = new BABYLON.Color3.Black();
               c.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
             })
           groupMesh.length = 0;
           currentMesh.material.emissiveColor = new BABYLON.Color3.Black();
           currentMesh.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
           currentMesh = null;
           return;
         }
       }

       var onPointerMove = function (evt) {
         if (!startingPoint) return;
         if(intersetMesh) intersetMesh.dispose();
         intersetMesh = null;
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
         if(groupMesh.length){
           groupMesh.forEach(function(m){
             m.position.addInPlace(diff);
             //m.moveWithCollisions(diff);
           })
         }

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
         if(intersetMesh){
           groupMesh.length = 0;
           cubeslist.forEach(function(c){
             if(intersetMesh.intersectsMesh(c, true)){
               c.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
               if(c != currentMesh) groupMesh.push(c);
             } else{
               c.material.emissiveColor = new BABYLON.Color3.Black();
             }
           })
         }
         
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

       // 2D
       if(false){
         clearCanvas2D();
         cubeslist.forEach(function(c){
           drawAxis(camera, c, false, false);
         })
       }
     });

     // Watch for browser/canvas resize events
     window.addEventListener("resize", function () {
       engine.resize();
     });
     
   }])