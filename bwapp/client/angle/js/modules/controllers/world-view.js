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
     var engine = new BABYLON.Engine(canvas, true);

// This begins the creation of a function that we will 'call' just after it's built
     var createScene = function () {
       // Now create a basic Babylon Scene object
       var scene = new BABYLON.Scene(engine);
       scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.OimoJSPlugin());
       // Change the scene background color to green.
       scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
       scene.collisionsEnabled = true;

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

       var boxmat = new BABYLON.StandardMaterial("cube1", scene);
       var boxt = new BABYLON.Texture("img/texture/wood.jpg", scene);
       boxt.uScale = boxt.vScale = 1;
       boxmat.diffuseTexture = boxt;
       boxmat.specularColor = BABYLON.Color3.Black();
       // Let's try our built-in 'sphere' shape. Params: name, subdivisions, size, scene
       var box = BABYLON.Mesh.CreateBox("cube1", 1, scene);
       box.material = boxmat;
       // Move the box upward 1/2 its height
       box.position.y = 5;
       box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:4, friction:0.5, restitution:0.1});
       box.checkCollisions = true;

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
       var t = new BABYLON.Texture("img/texture/plasticwhite.jpg", scene);
       t.uScale = t.vScale = 10;
       mat.diffuseTexture = t;
       mat.specularColor = BABYLON.Color3.Black();
       var gridshader = new BABYLON.ShaderMaterial("grid", scene, "grid", {});

       // Object
       var g = BABYLON.Mesh.CreateBox("ground", 100, scene);
       g.position.y = -10;
       g.scaling.y = 0.01;

       g.material = mat; //gridshader; //mat;
       g.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move:false});
       g.checkCollisions = true;

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