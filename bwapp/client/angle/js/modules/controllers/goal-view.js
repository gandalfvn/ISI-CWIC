/**========================================================
 * Module: goal-view.js
 * Created by wjwong on 8/12/15.
 =========================================================*/

angular.module('angle').controller('goalCtrl',
  ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteor', '$meteorCollection', 'ngDialog', 'toaster', function($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteor, $meteorCollection, ngDialog, toaster){
  "use strict";

  //check for agent role
  if(!$rootScope.isRole($rootScope.currentUser, 'agent')){
    return $state.go('app.root');
  }

  console.warn('$stateParams', $stateParams);

  var hasPhysics = false;
  var showGrid = true;
  var showAxis = false;

  //check for admin user
  console.warn($rootScope.currentUser);


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

  //******Start of Scene
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
      box.setPhysicsState({impostor:BABYLON.PhysicsEngine.BoxImpostor, move:true, mass:boxsize, friction:0.6, restitution:0.1});
    box.onCollide = function(a){
      console.warn('oncollide', objname, this, a)
    };*/
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

    // This creates and positions a free camera
    camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 15, -46), scene);
    // This targets the camera to scene origin
    camera.setTarget(new BABYLON.Vector3(0,12,0));
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
    var p = -2;
    for(var i = 0; i < 5; i++){
      createCube({
        pos: new BABYLON.Vector3(-16, cubesize.s, (p + i) * 2),
        scene: scene,
        size: 's',
        color: cubecolors[i],
        isVisible: false
      });
    }
    for(var i = 0; i < 5; i++){
      createCube({
        pos: new BABYLON.Vector3(17, cubesize.m, (p + i) * 4),
        scene: scene,
        size: 'm',
        color: cubecolors[i],
        isVisible: false
      });
    }
    for(var i = 0; i < 5; i++){
      createCube({
        pos: new BABYLON.Vector3((p + i) * 6, cubesize.l, 20),
        scene: scene,
        size: 'l',
        color: cubecolors[i],
        isVisible: false
      });
    }
    
    // Leave this function
    return scene;
  };  // End of createScene function

  var updateRender = function (scene) {
    return function(){
      scene.render();

      // 2D
      if(showAxis){
        clearCanvas2D();
        cubeslist.forEach(function(c){
          drawAxis(camera, c, true, true);
        })
      }
    }
  };

  function createWorld(){
    // Load the BABYLON 3D engine
    engine = new BABYLON.Engine(canvas);
    // Now, call the createScene function that you just finished creating
    scene = createScene();
    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(updateRender(scene));
  }

  // Watch for browser/canvas resize events
  window.addEventListener("resize", function () {
    engine.resize();
  });

  //**start app
  var blockreplays = $meteorCollection(BlockReplays).subscribe('blockreplays');

  $scope.toggleGrid = function(){
    showGrid = !showGrid;
    grid.isVisible = showGrid;
  };

  $scope.myreplay = null;
  setTimeout(function(){
    //must wait until BlockReplay has a connection to the db.
    $scope.myreplay = BlockReplays.findOne({_id: $stateParams.gameid});
    console.warn('BlockReplays', $scope.myreplay);
    if($scope.myreplay) gotoGoal();
    else toaster.pop('warning','Replay not found');
  },0);
  

  var gotoGoal = function(){
    if($scope.myreplay){
      for(var i = 0; i <= $scope.myreplay.end; i++){
        showReplay(i);
      }
    }
  };

  var showReplay = function(idx){
    var frame = $scope.myreplay.data.act[idx];
    var cube = cubesnamed[frame.name];
    cube.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
    cube.rotationQuaternion = new BABYLON.Quaternion(frame.rotquat.x, frame.rotquat.y, frame.rotquat.z, frame.rotquat.w);
    cube.isVisible = true;
  };

    // Now, call the createScene function that you just finished creating
  var scene;
  var grid;
  createWorld();
  //console.warn('cjson', CircularJSON.stringify(scene, null, 2));

}]);