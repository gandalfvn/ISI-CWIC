/**========================================================
 * Module: world-view.js
 * Created by wjwong on 7/27/15.
 =========================================================*/

angular.module('angle').controller('worldCtrl',
  ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', '$meteorCollection', 'ngDialog', 'toaster', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, $meteorCollection, ngDialog, toaster){
  "use strict";

  var hasPhysics = true;
  var showGrid = true;
  var showAxis = false;
  var pickGround = true;

  //check for agent role
  if($rootScope.isRole($rootScope.currentUser, 'agent')){
    return $state.go('app.root');
  }

  //*****draw axis
  var canvas2D = document.getElementById("canvas_2D");
  var context2D = canvas2D.getContext("2d");

  //Add a placeholder function for browsers that don't have setLineDash()
  if(!context2D.setLineDash){
    context.setLineDash = function(){
    }
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
    var xInLocalSpace = new BABYLON.Vector3(1, 0, 0);
    var yInLocalSpace = new BABYLON.Vector3(0, 1, 0);
    var zInLocalSpace = new BABYLON.Vector3(0, 0, 1);

    var cameraPositionInLocalSpace = camera.position.clone();

    // todo: case where camera has a parent

    var worldMatrix;
    var invWorldMatrix;
    if(mesh){
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

    if(drawAncestors && mesh){
      var endLine = drawAxis(camera, mesh.parent, drawAncestors, pivot);
      context2D.setLineDash([3, 9]);
      context2D.shadowBlur = 2;
      drawLine(startLine, endLine, "#ffffff");
      context2D.shadowBlur = 10;
      context2D.setLineDash([0]);
    }

    if(mesh && pivot){
      var parentWorldMatrix = mesh.parent ? mesh.parent.getWorldMatrix() : BABYLON.Matrix.Identity();
      var pivotWorldMatrix = mesh._localScaling.multiply(mesh._localRotation).multiply(mesh._localTranslation).multiply(parentWorldMatrix);

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

  var _drawAxis = function(startInLocalSpace, axisInLocalSpace, color, camera, worldMatrix, mesh){

    var endInLocalSpace = startInLocalSpace.add(axisInLocalSpace);

    var startInWorld = startInLocalSpace.clone();
    var endInWorld = endInLocalSpace.clone();

    if(mesh){
      startInWorld = BABYLON.Vector3.TransformCoordinates(startInWorld, worldMatrix);
      endInWorld = BABYLON.Vector3.TransformCoordinates(endInWorld, worldMatrix);
    }

    var v = _startEndLine(startInWorld, endInWorld, camera);

    var startVectorInView = v.start;
    if(!startVectorInView) return;
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

  var _startEndLine = function(startVector, endVector, camera){

    var res = {};

    var viewMatrix = camera.getViewMatrix();

    var pointOfPlane = new BABYLON.Vector3(0, 0, camera.minZ);
    var normalOfPlane = new BABYLON.Vector3(0, 0, 1);

    var startVectorInView = BABYLON.Vector3.TransformCoordinates(startVector, viewMatrix);
    var endVectorInView = BABYLON.Vector3.TransformCoordinates(endVector, viewMatrix);

    if(startVectorInView.z < 0 && endVectorInView.z < 0){
      return res;
    }

    var startLine;
    var endLine;

    if(startVectorInView.z >= 0 && endVectorInView.z >= 0){
      res.start = startVectorInView;
      res.end = endVectorInView;
      return res;
    }

    if(startVectorInView.z < 0){
      startVectorInView = _intersectionPoint(startVectorInView, endVectorInView, pointOfPlane, normalOfPlane);
    }
    else{
      endVectorInView = _intersectionPoint(startVectorInView, endVectorInView, pointOfPlane, normalOfPlane);
    }

    res.start = startVectorInView;
    res.end = endVectorInView;

    return res;
  };

  // inspiration from Blender
  var _intersectionPoint = function(p0, p1, pointOfPlane, normalOfPlane){
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

    if(Math.abs(dot) > 0.000001){
      // the factor of the point between p0 -> p1 (0 - 1)
      // if 'fac' is between (0 - 1) the point intersects with the segment.
      // otherwise:
      //  < 0.0: behind p0.
      //  > 1.0: infront of p1.
      var fac = -BABYLON.Vector3.Dot(normalOfPlane, w) / dot;
      u = u.scale(fac);
      return p0.add(u);
    }
    else{
      // The segment is parallel to plane
      return undefined;
    }
  };

  var drawLine = function(startPosition, endPosition, color){
    var prevStrokeStyle = context2D.strokeStyle;
    context2D.strokeStyle = color;
    context2D.beginPath();
    context2D.moveTo(startPosition.x, startPosition.y);
    context2D.lineTo(endPosition.x, endPosition.y);
    context2D.stroke();
    context2D.strokeStyle = prevStrokeStyle;
  };
  //*****end draw axis

  //******Start of Scene
  // Get the canvas element from our HTML above
  var canvas = document.getElementById("renderCanvasBab");
  var engine;

  var cubeslist = [];
  var numcubes = 0;
  var cubecolors = ['red', 'yellow', 'cyan', 'purple', 'green', 'orange'];
  var colorids = {};
  colorids['red'] = (new BABYLON.Color3.FromInts(210, 49, 93));
  colorids['yellow'] = (new BABYLON.Color3.FromInts(247, 200, 8));
  colorids['cyan'] = (new BABYLON.Color3.FromInts(34, 181, 191));
  colorids['purple'] = (new BABYLON.Color3.FromInts(135, 103, 166));
  colorids['green'] = (new BABYLON.Color3.FromInts(136, 193, 52));
  colorids['orange'] = (new BABYLON.Color3.FromInts(233, 136, 19));
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
    var objname = "cube_" + boxsize + '_' + data.color + '_' + numcubes;
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

    if(hasPhysics)
      box.setPhysicsState({
        impostor: BABYLON.PhysicsEngine.BoxImpostor,
        move: true,
        mass: boxsize,
        friction: 0.6,
        restitution: 0.1
      });
    box.onCollide = function(a){
      console.warn('oncollide', objname, this, a)
    };
    //box.updatePhysicsBodyPosition();
    //box.refreshBoundingInfo();
    //box.moveWithCollisions(new BABYLON.Vector3(-1, 0, 0));
    numcubes++;
    cubeslist.push(box);
  };

  /**
   * provide a quaternion and will return the current letter of up axis
   * return letter of up axis and direction based on positive or neg
   * neg = inverse
   * @param quat
   * @param axis
   * @returns {{axis: string, isInv: boolean}}
   */
  var findAxis = function(quat, axis){
    var qm = new BABYLON.Matrix.Identity();
    quat.toRotationMatrix(qm);
    var axisd = ['x', 'y', 'z'];
    var vect = [new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 0, 1)];
    var matchaxis = axisd.indexOf(axis);
    var maxmag = 0, idx = -1;
    var isInv = false;
    vect.forEach(function(v, i){
      var angdif = BABYLON.Vector3.Dot(vect[matchaxis], BABYLON.Vector3.TransformCoordinates(v, qm));
      var mag = Math.abs(angdif);
      if(mag > maxmag){
        maxmag = mag;
        isInv = (angdif < 0);
        idx = i;
      }
    });
    return {axis: axisd[idx], isInv: isInv};
  };

  /**
   * Receives a mesh cube to create volume from
   * Scene to attach
   * Also options available:
   * isCollider
   * isVisible
   * scale
   * size
   * name
   * emcolor
   * difcolor
   * @param mesh
   * @param scene
   * @param opt
   * @returns {*}
   */
  var createVolumeShadow = function(mesh, scene, opt){
    if(!opt.size || !opt.name || _.isUndefined(opt.isVisible)){
      console.warn('missing option info');
      return;
    }
    var volumeMesh;
    var objname = opt.name;
    var boxsize = opt.size;
    var volmat = new BABYLON.StandardMaterial(objname, scene);
    volmat.alpha = 0.3;
    volmat.diffuseColor = opt.difcolor.clone();
    volmat.emissiveColor = opt.emcolor.clone();
    volmat.backFaceCulling = true;
    volumeMesh = BABYLON.Mesh.CreateBox(objname, boxsize, scene);
    var myQuat = new BABYLON.Quaternion.Identity();
    if(mesh.rotationQuaternion) myQuat = mesh.rotationQuaternion.clone();
    else console.warn('mesh quaternion is identity ', mesh.name);
    //volumeMesh.rotationQuaternion = myQuat.clone(); //skip this we only want rotation based on Y
    //var upaxis = findUpAxis(myQuat);
    var euler = myQuat.toEulerAngles(); //get rotation
    volumeMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, -1, 0), euler.y); //create rotation based on Y so OUR volume is always Y UP!!!!
    volumeMesh.material = volmat;
    volumeMesh.isPickable = false;
    volumeMesh.backFaceCulling = true;
    volumeMesh.showBoundingBox = false;
    volumeMesh.checkCollisions = false;
    volumeMesh.applyGravity = false;
    volumeMesh.receiveShadows = false;
    volumeMesh.position = mesh.position.clone();
    //pretransform the vertices so we can get the actual bounds box
    volumeMesh.bakeTransformIntoVertices(volumeMesh.getWorldMatrix(true));
    var transform = new BABYLON.Matrix.Scaling(1, opt.scale, 1);
    /*if(upaxis.axis === 'x') transform = new BABYLON.Matrix.Scaling(scaling,1,1);
     if(upaxis.axis === 'z') transform = new BABYLON.Matrix.Scaling(1,1,scaling);*/
    volumeMesh.bakeTransformIntoVertices(transform);
    if(opt.isCollider){
      var vectorsWorld = volumeMesh.getBoundingInfo().boundingBox.vectorsWorld;
      var miny, maxy;
      vectorsWorld.forEach(function(v){
        if(v.y < miny || !miny) miny = v.y;
        if(v.y > maxy || !maxy) maxy = v.y;
      });
      volumeMesh.height = maxy - miny;
      volumeMesh.boxsize = opt.size;
      volumeMesh.offset = volumeMesh.height / 2 - volumeMesh.boxsize / 2;
      //base vector from 0,0,0 to offset in local space
      //to translate position so bottom is on the ground
      //must determine which axis is up and whether that axis is upside down
      var offset = volumeMesh.offset + 0.1;
      var bvinlocalspace = new BABYLON.Vector3(0, offset, 0);
      /*if(upaxis.axis === 'y'){
       if(upaxis.isInv){
       bvinlocalspace = new BABYLON.Vector3(0, -offset, 0);
       }
       else bvinlocalspace = new BABYLON.Vector3(0, offset , 0);
       }
       if(upaxis.axis === 'x'){
       if(upaxis.isInv){
       bvinlocalspace = new BABYLON.Vector3(-offset, 0, 0);
       }
       else bvinlocalspace = new BABYLON.Vector3(offset, 0, 0);
       }
       if(upaxis.axis === 'z'){
       if(upaxis.isInv){
       bvinlocalspace = new BABYLON.Vector3(0, 0, -offset);
       }
       else bvinlocalspace = new BABYLON.Vector3(0, 0, offset);
       }
       //no need for this because we didn't rotate the volume - its always up right
       //get rotation matrix to turn the vector - already compensated for upsidedown
       var qm = new BABYLON.Matrix.Identity();
       myQuat.toRotationMatrix(qm);
       //rotated right side up vector
       var bvinworldspace = BABYLON.Vector3.TransformCoordinates(bvinlocalspace, qm);
       //add to world mesh position
       volumeMesh.position.addInPlace(bvinworldspace);*/
      volumeMesh.position.addInPlace(bvinlocalspace);

      volumeMesh.ellipsoid = new BABYLON.Vector3(volumeMesh.boxsize, volumeMesh.height / 4, volumeMesh.boxsize);
      volumeMesh.backFaceCulling = false;
      volumeMesh.checkCollisions = false;
      volumeMesh.showBoundingBox = false;
      volumeMesh.isVisible = opt.isVisible;
      volumeMesh.material.alpha = 0.3;
      //volumeMesh.material.diffuseColor = new BABYLON.Color3.Green();
      //volumeMesh.refreshBoundingInfo();

      volumeMesh.onCollide = function(a){
        console.warn('vol oncollide', this.name, a.name)
      };


      /*var matPlan = new BABYLON.StandardMaterial("matPlan1", scene);
       matPlan.backFaceCulling = false;
       matPlan.emissiveColor = new BABYLON.Color3(0.2, 1, 0.2);
       var origin = BABYLON.Mesh.CreateSphere("origin", 6, 1, scene);
       origin.scaling['x'] = volumeMesh.boxsize/2;
       origin.scaling['y'] = volumeMesh.height/4;
       origin.scaling['z'] = volumeMesh.boxsize/2;
       //origin.position = volumeMesh.position.clone();
       origin.material = matPlan;*/
    }
    return volumeMesh;
  };

  var isZeroVec = function(vect3){
    if(vect3.x < -0.001 || vect3.x > 0.001) return false;
    if(vect3.y < -0.001 || vect3.y > 0.001) return false;
    if(vect3.z < -0.001 || vect3.z > 0.001) return false;
    return true;
  };

  // This begins the creation of a function that we will 'call' just after it's built
  var createScene = function(){
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
    camera.setTarget(new BABYLON.Vector3(0, 12, 0));
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
    shader.setColor3("topColor", BABYLON.Color3.FromInts(0, 119, 255));
    shader.setColor3("bottomColor", BABYLON.Color3.FromInts(240, 240, 255));
    shader.backFaceCulling = false;
    skybox.material = shader;

    /** GROUND **/
    // Material
    var mat = new BABYLON.StandardMaterial("ground", scene);
    mat.diffuseColor = BABYLON.Color3.FromInts(63, 117, 50);
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
    ground.onCollide = function(a, b){
      console.warn('oncollide ground', a, b)
    };
    ground.material = mat; //gridshader;
    if(hasPhysics)
      ground.setPhysicsState({impostor: BABYLON.PhysicsEngine.BoxImpostor, move: false});
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
    table.onCollide = function(a, b){
      console.warn('oncollide table', a, b)
    };
    table.material = tablemat; //gridshader;
    if(hasPhysics)
      table.setPhysicsState({impostor: BABYLON.PhysicsEngine.BoxImpostor, move: false});
    table.checkCollisions = true;
    table.receiveShadows = true;
    //table intersect mesh 
    var tableIMesh = createVolumeShadow(table, scene, {
      isCollider: true,
      isVisible: false,
      scale: 1,
      size: table.boxsize,
      name: 'coltable',
      emcolor: BABYLON.Color3.Blue(),
      difcolor: BABYLON.Color3.Blue()
    });

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
      createCube({
        pos: new BABYLON.Vector3(-16, cubesize.s * 2, (p + i) * 2),
        scene: scene,
        size: 's',
        color: cubecolors[i]
      });
    }
    for(var i = 0; i < 5; i++){
      createCube({
        pos: new BABYLON.Vector3(17, cubesize.m * 2, (p + i) * 4),
        scene: scene,
        size: 'm',
        color: cubecolors[i]
      });
    }
    for(var i = 0; i < 5; i++){
      createCube({
        pos: new BABYLON.Vector3((p + i) * 6, cubesize.l * 2, 20),
        scene: scene,
        size: 'l',
        color: cubecolors[i]
      });
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
    var pointerxy;
    var currentMesh;
    var groupMesh = [];
    var outMesh = [];
    var volumeMesh;
    var intersectMesh;
    var lockxz = false;
    var sceney = null;
    var rotxy = false;
    var scenerot = null;

   
    var getGroundPosition = function(){
      if(pickGround){
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

    /**
     * Transform a child mesh A world position to a parent relative (local) position
     * @param meshchild
     * @param meshparent
     * @constructor
     */
    var XformChildToParentRelPos = function(meshchild, meshparent){
      var invWorldMatrix = meshparent.getWorldMatrix().clone().invert();
      return BABYLON.Vector3.TransformCoordinates(meshchild.position.clone(), invWorldMatrix);
    };

    var pointerActive = false;
    var onPointerDown = function(evt){
      if(evt.button !== 0) return;
      // check if we are under a mesh
      var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function(mesh){
        return (mesh !== ground) && (mesh !== skybox) && (mesh !== volumeMesh)
          && (mesh !== intersectMesh) && (mesh !== grid) && (mesh !== table)
          && (mesh !== tableIMesh)
      });
      if(pickInfo.hit && !pickInfo.pickedMesh.isMoving){
        pointerActive = true;
        //we clean up things first;
        //onPointerUp();
        currentMesh = pickInfo.pickedMesh;
        if(hasPhysics) oimo.unregisterMesh(currentMesh); //stop physics
        console.warn('picked ', currentMesh.name, currentMesh);
        //startingPoint = pickInfo.pickedMesh.position.clone();//getGroundPosition(evt);
        if(pickInfo.pickedMesh.position){ // we need to disconnect camera from canvas
          setTimeout(function(){
            camera.detachControl(canvas);
          }, 0);
        }
        if(volumeMesh) volumeMesh.dispose();
        volumeMesh = createVolumeShadow(currentMesh, scene, {
          isCollider: false,
          isVisible: true,
          scale: 70,
          size: currentMesh.boxsize,
          name: 'vol' + currentMesh.boxsize,
          emcolor: BABYLON.Color3.Black(),
          difcolor: BABYLON.Color3.Gray()
        });
        if(intersectMesh) intersectMesh.dispose();
        intersectMesh = createVolumeShadow(currentMesh, scene, {
          isCollider: true,
          isVisible: true,
          scale: 30,
          size: currentMesh.boxsize * 0.98,
          name: 'col' + currentMesh.boxsize,
          emcolor: BABYLON.Color3.Red(),
          difcolor: BABYLON.Color3.Red()
        });
        intersectMesh.checkCollisions = true;
        setTimeout(function(){//give it 10 ms to propogate mesh updates
          if(intersectMesh){
            groupMesh.length = 0;
            outMesh.length = 0;
            var InvQ = BABYLON.Quaternion.Inverse(intersectMesh.rotationQuaternion);
            var isZeroPosition = false; //check if we have a screwed up invworldmatrix - if we do then one of the mesh will move to 0,0,0 instead of the bottom of the volume mesh.
            cubeslist.forEach(function(c){
              if(intersectMesh.intersectsMesh(c, true)){
                if(hasPhysics) oimo.unregisterMesh(c); //stop physics
                /*console.warn('c', c);
                 console.warn('intersectMesh', intersectMesh);
                 console.warn('cpa', c.position, intersectMesh.position);*/
                c.parent = intersectMesh;
                c.position = XformChildToParentRelPos(c, intersectMesh);
                //console.warn('cpb', c.position);
                if(isZeroVec(c.position)) isZeroPosition = true;
                //c.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
                //translate cube to intersetmesh local space 0,0,0
                //this formula gets fractional rotation from mesh rotation based on
                //the bottom cube
                if(c.rotationQuaternion) c.rotationQuaternion = InvQ.multiply(c.rotationQuaternion);
                else console.warn('object contains no rotationQuaternion');
                //c.rotationQuaternion = intersectMesh.rotationQuaternion.multiply(BABYLON.Quaternion.Inverse(c.rotationQuaternion));
                c.checkCollisions = false;
                c.showBoundingBox = false;
                //console.warn('me elp', c.ellipsoid);
                groupMesh.push(c);
              } else{
                outMesh.push(c);
                c.parent = null;
                c.checkCollisions = true;
                c.showBoundingBox = false;
                c.material.emissiveColor = new BABYLON.Color3.Black();
              }
            });
            if(isZeroPosition){
              console.warn('FIXED BAD MESH OFFSET');
              var offset = new BABYLON.Vector3(0, -intersectMesh.offset, 0);
              groupMesh.forEach(function(c){
                c.position.addInPlace(offset);
              })
            }
            startingPoint = intersectMesh.position.clone();//getGroundPosition(evt);
            pointerxy = new BABYLON.Vector2(scene.pointerX, scene.pointerY);
          }
        }, 50)
      }
    };

    var onPointerUp = function(){
      if(startingPoint){
        pointerActive = false;
        camera.attachControl(canvas, true);
        startingPoint = null;
        sceney = null;
        //must remove collision check prior to dispose or you get invisible mesh collisions!!!
        intersectMesh.checkCollisions = false;
        if(volumeMesh) volumeMesh.dispose();
        volumeMesh = null;
        if(groupMesh)
          groupMesh.forEach(function(c){
            c.parent = null;
            c.tchecked = false;
            //after removing from parent
            //transform local position to world position
            c.position = BABYLON.Vector3.TransformCoordinates(c.position, intersectMesh.getWorldMatrix());
            //c.position.addInPlace(intersectMesh.position.clone());
            c.rotationQuaternion = intersectMesh.rotationQuaternion.multiply(c.rotationQuaternion);
            c.checkCollisions = true;
            c.showBoundingBox = false;
            c.material.emissiveColor = new BABYLON.Color3.Black();
            //must add physics no matter if its off the ground fo collisions to tork
            if(hasPhysics) c.setPhysicsState({
              impostor: BABYLON.PhysicsEngine.BoxImpostor,
              move: true,
              mass: c.boxsize,
              friction: 0.6,
              restitution: 0.1
            });
          });
        groupMesh.length = 0;
        if(intersectMesh) intersectMesh.dispose();
        intersectMesh = null;
        currentMesh = null;
      }
    };

    var onPointerMove = function(evt){
      if(!startingPoint) return;
      var current;
      var delta;
      if(lockxz){
        current = startingPoint.clone();
        delta = (sceney - scene.pointerY) * 0.2;
        current.y += delta;
        sceney = scene.pointerY;
      }
      else if(!rotxy) current = getGroundPosition(evt);
      else{
        current = null; //skip translating mesh below
        var euler = intersectMesh.rotationQuaternion.toEulerAngles();
        delta = (scenerot.x - scene.pointerX);
        var rotRad = 0.087266; //5 deg. in radian
        var rotval;
        if(delta < 0) rotval = euler.y - rotRad;
        else rotval = euler.y + rotRad;
        if(rotval > Math.PI) rotval = 0;
        if(rotval < 0) rotval = Math.PI;
        rotval = (Math.round(rotval / rotRad)) * rotRad; //round to nearest 5 deg
        //snap rotval to 5 degree increments
        intersectMesh.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(0, 1, 0), rotval); //Y is UP in intersect mesh
        volumeMesh.rotationQuaternion = intersectMesh.rotationQuaternion.clone();
        scenerot.x = scene.pointerX;
      }

      if(!current) return;
      var diff;
      diff = current.subtract(startingPoint);
      intersectMesh.moveWithCollisions(diff);
      volumeMesh.position = intersectMesh.position.clone();
      startingPoint = current;
    };

    //require hand.js from ms
    canvas.addEventListener("pointerdown", onPointerDown, false);
    canvas.addEventListener("pointerup", onPointerUp, false);
    canvas.addEventListener("pointermove", onPointerMove, false);

    scene.onDispose = function(){
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
    };

    window.addEventListener("keydown", function(evt){
      switch(evt.keyCode){
        case 18:
          if(currentMesh){
            rotxy = true;
            scenerot = {x: scene.pointerX, y: scene.pointerY};
          }
          break;
        case 16:
          if(currentMesh){
            lockxz = true;
            sceney = scene.pointerY;
          }
          break;
        default:
          break;
      }
    });

    window.addEventListener("keyup", function(evt){
      switch(evt.keyCode){
        case 18:
          rotxy = false;
          scenerot = null;
          break;
        case 16:
          lockxz = false;
          sceney = null;
          break;
        default:
          break;
      }
    });

    var animate = function(){
      var frameScene = [];
      var saveFrame = false; //save content at every frame but not all saved content is stored
      cubeslist.forEach(function(c){
        if(intersectMesh){
          if(intersectMesh.intersectsMesh(c, true)){
            c.material.emissiveColor = new BABYLON.Color3(0, 0, 1);
          } else{
            c.material.emissiveColor = new BABYLON.Color3.Black();
          }
        }
        if(tableIMesh && $scope.recstatus === 'r'){
          if(tableIMesh.intersectsMesh(c, true) && !c.isMoving && !pointerActive){
            if(!c.tchecked){
              //only store content where something changed on the table
              c.material.emissiveColor = new BABYLON.Color3(0, 0.5, 0.5);
              c.tchecked = true;
              saveFrame = true;
              if(_.isUndefined($scope.replaydata.visible[c.name])) //keyframe for cube appear
                $scope.replaydata.visible[c.name] = $scope.replaydata.act.length;
            }
            else c.material.emissiveColor = new BABYLON.Color3.Black();
            frameScene.push({
              name: c.name,
              position: c.position.clone(),
              rotquat: c.rotationQuaternion.clone()
            });
            //console.warn($scope.replaydata.act.length);
          }else
            c.material.emissiveColor = new BABYLON.Color3.Black();
        }
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
          }
          else{
            c.material.emissiveColor = new BABYLON.Color3(0.176, 0.85, 0.76);
            c.isMoving = true;
          }
        }
        c.oldpos = c.position.clone();
      });
      if(frameScene.length && saveFrame){
        console.warn('frame', frameScene);
        $scope.$apply(function(){$scope.replaydata.act.push(frameScene);});
      }
    };

    var prepareButton = function(mesh){
      mesh.actionManager = new BABYLON.ActionManager(scene);
      mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOutTrigger, mesh.material, "emissiveColor", mesh.material.emissiveColor));
      mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh.material, "emissiveColor", new BABYLON.Color3(0.3, 0.3, 0.3)));
      /*mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function() {
       //oimo.unregisterMesh(mesh); //stop physics
       }));*/
      //mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function() {cameraFly.restart();}));
      //mesh.actionManager.registerAction(new BABYLON.StopAnimationAction(BABYLON.ActionManager.OnPointerOverTrigger, mesh));
    };

    cubeslist.forEach(function(c){
      prepareButton(c);
    });

    scene.registerBeforeRender(animate);
    // Leave this function
    return scene;
  };  // End of createScene function

  var updateRender = function(scene){
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
  window.addEventListener("resize", function(){
    engine.resize();
  });

  //**start app
  $scope.replaydata = {visible: {}, act: []};
  $scope.blockreplays = $meteorCollection(BlockReplays).subscribe('blockreplays');

  $scope.resetWorld = function(){
    $scope.replaydata.act.length = 0;
    $scope.replaydata.visible = {};
    camera.dispose();
    scene.dispose();
    engine.dispose();
    engine = null;
    camera = null;
    scene = null;
    createWorld();
  };

  $scope.toggleGrid = function(){
    showGrid = !showGrid;
    grid.isVisible = showGrid;
  };

  $scope.recstatus = 's';

  $scope.setRecStat = function(type){
    $scope.recstatus = type;
    switch(type){
      case 'r':
        toaster.pop('info', 'Recording Started');
        break;
      case 's':
        toaster.pop('info', 'Recording Stopped', 'To continue recording where you left off select Record.');
        break;
      case 'd':
        $scope.recstatus = 's';
        $scope.replaydata.act.length = 0;
        $scope.replaydata.visible = {};
        toaster.pop('info', 'Recording Deleted');
        break;
    }
  };

  $scope.saveReplay = function(){
    if($scope.replaydata.act.length){
      console.warn('saveReplay');
      var dialog = ngDialog.open({
        template: 'didReplayName',
        controller: ['$scope', function($scope){
          camera.detachControl(canvas);
        }]
      });
      dialog.closePromise.then(function(data){
        camera.attachControl(canvas, true);
        console.log('ngDialog closed', data);
        if(data.value){
          var replaydb = {
            name: data.value,
            owner: $rootScope.currentUser._id,
            created: new Date().getTime(),
            creator: $rootScope.currentUser.username,
            data: angular.copy($scope.replaydata)
          };
          $scope.blockreplays.save(replaydb).then(function(val){
            toaster.pop('info', 'Replay ' + replaydb.name + ' Saved');
          }, function(err){
            toaster.pop('error', 'Replay ' + replaydb.name, err.reason);
          });
          $scope.replaydata.act.length = 0;
          $scope.replaydata.visible = {};
        }
      });
    }
    else
      toaster.pop('warning', 'No Recording', 'Please record something before save.');
  };

  // Now, call the createScene function that you just finished creating
  var scene;
  var grid;
  createWorld();
  console.warn($rootScope.currentUser, $scope);
  //console.warn('cjson', CircularJSON.stringify(scene, null, 2));

}]);