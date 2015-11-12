/**========================================================
 * Module: gen-world-view.ts
 * Created by wjwong on 9/9/15.
 =========================================================*/
/// <reference path="../../../../../model/genstatesdb.ts" />
/// <reference path="../../../../../model/screencapdb.ts" />
/// <reference path="../../../../../public/vendor/lz-string/typings/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/underscore/underscore.d.ts" />
/// <reference path="../../../../../public/vendor/babylonjs/babylon.2.2.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../services/apputils.ts" />
angular.module('angle').controller('genWorldCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', 'ngDialog', 'toaster', 'APP_CONST', 'ngTableParams', 'AppUtils', function ($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, ngDialog, toaster, APP_CONST, ngTableParams, apputils) {
        "use strict";
        var hasPhysics = true;
        var fric = 0.1;
        var rest = 0.2;
        var showGrid = true;
        var mult = 100; //position multiplier for int random
        // Get the canvas element from our HTML above
        var canvas = document.getElementById("renderCanvasBab");
        var engine;
        var cubeslist = [];
        var cubesdata = {};
        var cubesid;
        //var cubesdesctocid = {};
        var numcubes = 0;
        var cubecolors = ['red', 'blue', 'green', 'cyan', 'magenta', 'yellow'];
        var cubenames = ['adidas', 'bmw', 'burger king', 'coca cola', 'esso', 'heineken', 'hp', 'mcdonalds', 'mercedes benz', 'nvidia', 'pepsi', 'shell', 'sri', 'starbucks', 'stella artois', 'target', 'texaco', 'toyota', 'twitter', 'ups'];
        var colorids = {};
        colorids['red'] = BABYLON.Color3.FromInts(255, 0, 0);
        colorids['blue'] = BABYLON.Color3.FromInts(0, 0, 255);
        colorids['magenta'] = BABYLON.Color3.FromInts(200, 0, 200);
        colorids['yellow'] = BABYLON.Color3.FromInts(255, 255, 0);
        colorids['cyan'] = BABYLON.Color3.FromInts(34, 181, 191);
        colorids['purple'] = BABYLON.Color3.FromInts(135, 103, 166);
        colorids['green'] = BABYLON.Color3.FromInts(0, 255, 0);
        colorids['orange'] = BABYLON.Color3.FromInts(233, 136, 19);
        //['#d2315d', '#f7c808', '#22b5bf', '#8767a6', '#88c134', '#e98813'];
        var cubesize = {
            s: 1,
            m: 2,
            l: 3
        };
        var camera;
        var numTextures = new Array(21);
        /**
         * Create Dynamic number textures for use in cubes
         */
        var createNumTexture = function (scene) {
            for (var i = 0; i < numTextures.length; i++) {
                numTextures[i] = new BABYLON.DynamicTexture("dynamic texture", 256, scene, true);
                numTextures[i].drawText(i.toString(), 32, 128, "bold 140px verdana", "black", "#aaaaaa");
            }
        };
        /**
         * Create cubes based on size s m l and color
         * data: size, color scene, pos (position)
         * @param data
         */
        var createCube = function (data) {
            var block = data.block;
            var boxsize = block.shape.shape_params.side_length;
            var objdesc = block.name + '_' + block.shape.type + '_' + boxsize;
            var objname = objdesc + '_' + block.id;
            var boxcolor = colorids['orange'];
            var boxmat = new BABYLON.StandardMaterial(objname, data.scene);
            //boxmat.diffuseTexture.hasAlpha = true;
            //boxmat.specularColor = BABYLON.Color3.Black();
            boxmat.alpha = 1.0;
            //boxmat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
            if ($scope.opt.showImages) {
                var boxt;
                if ($scope.opt.showLogos)
                    boxt = new BABYLON.Texture("img/textures/logos/" + block.name.replace(/ /g, '') + '.png', scene);
                else
                    boxt = numTextures[block.id];
                boxt.uScale = boxt.vScale = 1;
                boxmat.diffuseTexture = boxt;
            }
            //boxmat.diffuseColor = boxcolor;
            //boxmat.alpha = 0.8;
            /*var hSpriteNb =  14;  // 6 sprites per raw
            var vSpriteNb =  8;  // 4 sprite raws
            var faceUV = new Array(6);
            for (var i = 0; i < 6; i++) {
              faceUV[i] = new BABYLON.Vector4(0/hSpriteNb, 0, 1/hSpriteNb, 1 / vSpriteNb);
            }*/
            var faceCol = new Array(6);
            for (var i = 0; i < 6; i++) {
                var cv = colorids[block.shape.shape_params['face_' + (i + 1)].color];
                faceCol[i] = new BABYLON.Color4(cv.r, cv.g, cv.b, 1);
            }
            var opt = {
                width: boxsize,
                height: boxsize,
                depth: boxsize,
                faceColors: faceCol
            };
            var box = BABYLON.Mesh.CreateBox(objname, opt, data.scene);
            //var box = BABYLON.Mesh.CreateBox(objname, boxsize, data.scene);
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
            box.onCollide = function (a) {
                console.warn('oncollide', objname, this, a);
            };
            //box.updatePhysicsBodyPosition();
            //box.refreshBoundingInfo();
            //box.moveWithCollisions(new BABYLON.Vector3(-1, 0, 0));
            numcubes++;
            cubesdata[block.id] = { objidx: cubeslist.length, meta: block };
            cubeslist.push(box);
        };
        var isZeroVec = function (vect3) {
            if (vect3.x < -0.001 || vect3.x > 0.001)
                return false;
            if (vect3.y < -0.001 || vect3.y > 0.001)
                return false;
            if (vect3.z < -0.001 || vect3.z > 0.001)
                return false;
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
            console.warn('oimo', oimo);
            scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), oimo);
            // Change the scene background color to green.
            scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
            scene.collisionsEnabled = true;
            scene.workerCollisions = true;
            //  Create an ArcRotateCamera aimed at 0,0,0, with no alpha, beta or radius, so be careful.  It will look broken.
            camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 0, 0, APP_CONST.fieldsize, new BABYLON.Vector3(0, 0, 0), scene);
            // Quick, let's use the setPosition() method... with a common Vector3 position, to make our camera better aimed.
            camera.setPosition(new BABYLON.Vector3(0, APP_CONST.fieldsize * 0.95, -(APP_CONST.fieldsize * 0.8)));
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
            scene.activeCamera.attachControl(canvas);
            // This creates a light, aiming 0,1,0 - to the sky.
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            // Dim the light a small amount
            light.intensity = 1.0;
            // this creates dir. light for shadows
            /*var dirlight = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-0.4, -2, -0.4), scene);
            // Dim the light a small amount
            dirlight.intensity = 0.6;
            dirlight.position = new BABYLON.Vector3(0, 40, 0);*/
            /*var pl = new BABYLON.PointLight("pl", new BABYLON.Vector3(0, 10, 0), scene);
            pl.diffuse = new BABYLON.Color3(1, 1, 1);
            pl.specular = new BABYLON.Color3(1, 1, 1);
            pl.intensity = 0.8;*/
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
            var ground = BABYLON.Mesh.CreateBox("ground", 200, scene);
            ground.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
            ground.position.y = -0.1;
            ground.scaling.y = 0.001;
            ground.onCollide = function (a) {
                console.warn('oncollide ground', a);
            };
            ground.material = mat; //gridshader;
            if (hasPhysics)
                ground.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move: false });
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
            var tableboxsize = APP_CONST.fieldsize;
            table = BABYLON.Mesh.CreateBox("table", tableboxsize, scene);
            table.boxsize = tableboxsize;
            table.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
            table.position.y = 0;
            table.scaling.y = 0.001;
            table.onCollide = function (a) {
                console.warn('oncollide table', a);
            };
            table.material = tablemat; //gridshader;
            if (hasPhysics)
                table.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move: false });
            table.checkCollisions = true;
            table.receiveShadows = true;
            /*var gridmat:BABYLON.StandardMaterial = new BABYLON.StandardMaterial("grid", scene);
            gridmat.wireframe = true; //create wireframe
            gridmat.diffuseColor = BABYLON.Color3.Gray();
            grid = BABYLON.Mesh.CreateGround("grid", APP_CONST.fieldsize, APP_CONST.fieldsize, 6, scene, false); //used to show grid
            grid.position.y = 0.01;
            grid.scaling.y = 0.001;
            grid.material = gridmat;*/
            var animate = function () {
                isSteadyState = true;
                cubeslist.forEach(function (c) {
                    //count the number of 0 move ticks
                    if (c.oldpos) {
                        var delta = c.oldpos.subtract(c.position);
                        if (isZeroVec(delta)) {
                            if (!c.zeromoveTicks)
                                c.zeromoveTicks = 0;
                            c.zeromoveTicks++;
                            if (c.isMoving && c.zeromoveTicks > 25) {
                                c.material.emissiveColor = BABYLON.Color3.Black();
                                c.isMoving = false;
                                c.zeromoveTicks = 0;
                                c.tchecked = false;
                            }
                            else if (c.isMoving)
                                isSteadyState = false;
                        }
                        else {
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
        }; // End of createScene function
        var updateRender = function (scene) {
            return function () {
                scene.render();
            };
        };
        function createWorld() {
            // Load the BABYLON 3D engine
            engine = new BABYLON.Engine(canvas);
            // Now, call the createScene function that you just finished creating
            scene = createScene();
            //create dynamic number textures
            createNumTexture(scene);
            // Register a render loop to repeatedly render the scene
            engine.runRenderLoop(updateRender(scene));
        }
        ;
        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
            engine.resize();
        });
        //**start app================================================================
        //**3D helpers
        var createObjects = function (blocks) {
            if (cubeslist.length)
                cubeslist.forEach(function (c) {
                    if (hasPhysics)
                        oimo.unregisterMesh(c); //stop physics
                    c.dispose();
                });
            cubeslist.length = 0;
            cubesdata = {};
            numcubes = 0;
            var p = -2;
            var i = 0;
            var z = 0;
            var zpos = [0, 1, 2];
            for (var j = 0; j < blocks.length; j++) {
                createCube({ pos: new BABYLON.Vector3((p + i), blocks[j].shape.shape_params.side_length, zpos[z]), scene: scene, block: blocks[j], isVisible: true });
                if (i > 3) {
                    i = 0;
                    z++;
                }
                else
                    i++;
            }
            cubesid = Object.keys(cubesdata);
        };
        var get3DCubeById = function (cid) {
            return cubeslist[cubesdata[cid].objidx];
        };
        //**start app logic============================================================
        $scope.opt = {};
        $scope.opt.showImages = true;
        $scope.opt.showLogos = true;
        $scope.opt.limStack = true;
        $scope.curState = new apputils.cCurrentState();
        var genstates = $scope.$meteorCollection(GenStates);
        $scope.$meteorSubscribe("genstates").then(function (sid) { dataReady.update('genstates'); }, function (err) { console.log("error", arguments, err); });
        var screencaps = $scope.$meteorCollection(ScreenCaps);
        $scope.$meteorSubscribe("screencaps").then(function (sid) { dataReady.update('screencaps'); }, function (err) { console.log("error", arguments, err); });
        var dataReady = new apputils.cDataReady(2, function () {
            updateTableStateParams();
            $rootScope.dataloaded = true;
        });
        var updateTableStateParams = function () {
            var data = GenStates.find({}, { sort: { "_id": 1 } }).fetch();
            $scope.tableStateParams = new ngTableParams({
                count: 5,
                sorting: { created: 'desc' }
            }, { counts: [5, 10, 20],
                paginationMaxBlocks: 8,
                paginationMinBlocks: 2,
                data: data });
        };
        $scope.resetWorld = function () {
            var c;
            var p = -2, i = 0, z = 0;
            var zpos = [7, 8, 9, 10];
            for (var j = 0; j < cubeslist.length; j++) {
                c = cubeslist[j];
                if (hasPhysics)
                    oimo.unregisterMesh(c); //stop physics
                c.position = new BABYLON.Vector3((p + i), c.boxsize, zpos[z]);
                c.rotationQuaternion = BABYLON.Quaternion.Identity().clone();
                c.isVisible = true;
                if (i > 3) {
                    i = 0;
                    z++;
                }
                else
                    i++;
            }
            camera.setPosition(new BABYLON.Vector3(0, APP_CONST.fieldsize * 0.95, -(APP_CONST.fieldsize * 0.8)));
        };
        /**
         * Overlap check for src inside tgt mesh in the x z footprint
         * @param src
         * @param tgt
         * @returns {boolean}
         */
        var intersectsMeshXYZ = function (src, tgt, checkY) {
            var s = (src.prop.size / 2) - 0.01; //slightly small
            var a = {
                max: { x: src.position.x + s, y: src.position.y + s, z: src.position.z + s },
                min: { x: src.position.x - s, y: src.position.y - s, z: src.position.z - s }
            };
            s = (tgt.prop.size / 2) - 0.01;
            var b = {
                max: { x: tgt.position.x + s, y: tgt.position.y + s, z: tgt.position.z + s },
                min: { x: tgt.position.x - s, y: tgt.position.y - s, z: tgt.position.z - s }
            };
            if (a.max.x < b.min.x)
                return false; // a is left of b
            if (a.min.x > b.max.x)
                return false; // a is right of b
            if (a.max.z < b.min.z)
                return false; // a is front b
            if (a.min.z > b.max.z)
                return false; // a is back b
            if (checkY)
                if (a.min.y > b.max.y)
                    return false; // a is top b
            return true; // boxes overlap
        };
        /**
         * Check for cube overlap and increase height based on in order cube creation so updates to mycube y is correct
         * @param mycube - current cube
         * @param used - list of cubes already created in fifo order
         * @param idxdata - index associative array to get prev cube positions
         */
        var updateYCube = function (mycube, used, idxdata) {
            var myArr = [];
            used.forEach(function (c) { myArr.push(c); });
            for (var i = 0; i < myArr.length; i++) {
                var c = idxdata[myArr[i]];
                if (intersectsMeshXYZ(mycube, c, true)) {
                    //console.warn('intersect', mycube.prop.cid, mycube.position, c.prop.cid, c.position);
                    //half of the size of the cube is from base cube other half from current cube
                    mycube.position.y = c.position.y + c.prop.size / 2 + mycube.prop.size / 2;
                }
            }
        };
        /**
         * generate cube close to anchor cube if there is none then we just generate cube via field.
         * returns null or vector3 position.
         * @param size
         * @param used
         * @param idxdata
         * @returns {*}
         */
        var genCubeNear = function (size, used, idxdata) {
            if (used.length) {
                var myArr = used; //its an array
                var halfsize = size / 2;
                var halfrad = APP_CONST.fieldsize / 4; //near radius
                var anchorIdx = myArr[apputils.rndInt(0, myArr.length - 1)];
                var aPos = idxdata[anchorIdx].position;
                var fieldmin = -(APP_CONST.fieldsize / 2) + (size / 2);
                var fieldmax = (APP_CONST.fieldsize / 2) - (size / 2);
                var min = -halfrad + halfsize;
                var max = halfrad - halfsize;
                var val = APP_CONST.fieldsize;
                var it = 0;
                while (val > fieldmax || val < fieldmin) {
                    val = apputils.rndInt(min * mult, max * mult) / mult + aPos.x;
                    if (it > 50) {
                        console.warn('it > 50 posx:', val);
                    }
                    ;
                }
                var xval = val;
                val = APP_CONST.fieldsize;
                it = 0;
                while (val > fieldmax || val < fieldmin) {
                    val = apputils.rndInt(min * mult, max * mult) / mult + aPos.z;
                    if (it > 50) {
                        console.warn('it > 50 posz:', val);
                    }
                    ;
                }
                var zval = val;
                return { anchorCid: anchorIdx, position: new BABYLON.Vector3(xval, halfsize, zval) };
            }
            console.error('no existing cubes found');
            return null;
        };
        var genCubeFar = function (size, used, idxdata) {
            if (used.length) {
                var myArr = used; //its an array
                var halfsize = size / 2;
                var halfrad = APP_CONST.fieldsize / 4; //avoid radius
                var anchorIdx = myArr[apputils.rndInt(0, myArr.length - 1)];
                var aPos = idxdata[anchorIdx].position;
                var fieldmin = -(APP_CONST.fieldsize / 2) + (size / 2);
                var fieldmax = (APP_CONST.fieldsize / 2) - (size / 2);
                var min = -halfrad + halfsize;
                var max = halfrad - halfsize;
                var val = { x: APP_CONST.fieldsize, z: APP_CONST.fieldsize };
                var it = 0;
                while (val.x > fieldmax || val.x < fieldmin ||
                    val.z > fieldmax || val.z < fieldmin ||
                    (val.x > aPos.x + min && val.x < aPos.x + max
                        && val.z > aPos.z + min && val.z < aPos.z + max)) {
                    val.x = apputils.rndInt(fieldmin * mult, fieldmax * mult) / mult;
                    val.z = apputils.rndInt(fieldmin * mult, fieldmax * mult) / mult;
                    it++;
                    if (it > 50)
                        console.warn('it > 50 pos:', val);
                }
                return { anchorCid: anchorIdx, position: new BABYLON.Vector3(val.x, halfsize, val.z) };
            }
            console.error('no existing cubes found');
            return null;
        };
        /**
         * Generate stack of the anchor cube on top of the base cube
         * @param size
         * @param used
         * @param idxdata
         * @returns {*}
         */
        var genCubeStack = function (size, used, idxdata) {
            if (used.length) {
                var myArr = used; //its an array
                var aidx = apputils.rndInt(0, myArr.length - 1); //cube to move
                var anchorIdx = myArr[aidx];
                var halfsize = idxdata[anchorIdx].prop.size / 2;
                var aPos = idxdata[anchorIdx].position;
                //console.warn('genCubeStack', anchorIdx, aPos);
                return { anchorCid: anchorIdx, position: new BABYLON.Vector3(aPos.x, halfsize, aPos.z) };
            }
            console.error('no existing cubes found');
            return null;
        };
        //todo: this is not used
        var genCubeState0 = function (used, idxdata) {
            var cid = null;
            while (cid === null || _.indexOf(used, cid) > -1) {
                cid = Number(cubesid[apputils.rndInt(0, cubesid.length - 1)]);
            }
            var max = APP_CONST.fieldsize / 2 + 0.001; //give it a little wiggle room
            var min = -max;
            var data = {
                prop: {
                    size: cubesdata[cid].meta.shape.shape_params.side_length,
                    cid: cid
                },
                position: null
            };
            var isRegen = true;
            while (isRegen) {
                if (used.length) {
                    var ltype = apputils.rndInt(0, 9);
                    if (ltype < 5) {
                        //console.warn('state0 near');
                        var cubeDat = genCubeNear(data.prop.size, used, idxdata);
                        if (cubeDat)
                            data.position = cubeDat.position;
                    }
                    else {
                        //console.warn('state0 far');
                        var cubeDat = genCubeFar(data.prop.size, used, idxdata);
                        if (cubeDat)
                            data.position = cubeDat.position;
                    }
                    if (cubeDat && cubeDat.position)
                        data.position = cubeDat.position;
                    else
                        $scope.$apply(function () {
                            toaster.pop('error', 'missing position');
                        });
                }
                else {
                    var minloc = (-(APP_CONST.fieldsize / 2) + (data.prop.size / 2)) * mult;
                    var maxloc = ((APP_CONST.fieldsize / 2) - (data.prop.size / 2)) * mult;
                    data.position = new BABYLON.Vector3(apputils.rndInt(minloc, maxloc) / mult, (data.prop.size / 2), apputils.rndInt(minloc, maxloc) / mult);
                }
                if ((data.position.x - data.prop.size / 2) >= min && (data.position.x + data.prop.size / 2) <= max &&
                    (data.position.z - data.prop.size / 2) >= min && (data.position.z + data.prop.size / 2) <= max) {
                    var cubespos = [];
                    _.each(idxdata, function (i) {
                        cubespos.push(i);
                    });
                    var anchorStack = getStackCubes(data, cubespos, null, false);
                    console.warn('output', cid, anchorStack.length);
                    if (anchorStack.length < 2)
                        isRegen = false;
                }
            }
            updateYCube(data, used, idxdata);
            used.push(cid);
            idxdata[cid] = data;
            console.warn('genCubeState0', cid, data);
            return data;
        };
        /**
         * Append moves to end of the states list
         * @param params
         */
        $scope.genStateN = function (params) {
            console.warn('genStateN', params);
            //we must get the state for this params.sid
            if ($scope.curState._id) {
                var myframe = $scope.curState;
                //if(!params.cstate) //show when we use 'show state' input
                //create a munge of cube position rotate and props
                var used = [];
                var cidlist = [];
                var cubeInWorld = {};
                var cubesused = [];
                //create updated blockmeta
                var cubemeta = {};
                var maxsize = 0;
                _.each(myframe.block_meta.blocks, function (m) {
                    cubemeta[m.id] = m;
                });
                var cstate = myframe.block_states.length;
                var block_state = [];
                var orig = myframe.block_states[cstate - 1].block_state;
                for (var i = 0; i < orig.length; i++) {
                    var pos = _.extend({}, orig[i].position);
                    var rot = _.extend({}, orig[i].rotation);
                    block_state.push({ id: orig[i].id, position: pos, rotation: rot });
                }
                _.each(block_state, function (p, i) {
                    var size = cubemeta[p.id].shape.shape_params.side_length;
                    if (maxsize < size)
                        maxsize = size;
                    var val = { prop: { cid: p.id, size: size }, position: p.position, rotation: p.rotation };
                    used.push(val);
                    cubeInWorld[p.id] = val;
                    cidlist.push(p.id);
                    cubesused.push(p.id);
                });
                cubesused = _.uniq(cubesused);
                var isRegen = true;
                var cubeDat, acube, cubeStack;
                while (isRegen) {
                    //let gencube choose a cube and create a position based on it
                    var ltype = apputils.rndInt(0, 19);
                    if (cidlist.length < 2) {
                        ltype = apputils.rndInt(0, 9);
                    }
                    if (ltype < 10) {
                        if (ltype < 5) {
                            cubeDat = genCubeNear(maxsize, cidlist, cubeInWorld);
                        }
                        else {
                            cubeDat = genCubeFar(maxsize, cidlist, cubeInWorld);
                        }
                    }
                    else {
                        cubeDat = genCubeStack(maxsize, cidlist, cubeInWorld);
                    }
                    //now we randomly choose a cube outside of the anchor cube id to move to the new position
                    var mycid = cubeDat.anchorCid;
                    while (mycid == cubeDat.anchorCid && block_state.length > 1) {
                        mycid = block_state[apputils.rndInt(0, block_state.length - 1)].id;
                    }
                    acube = cubeInWorld[mycid];
                    //check Y because we will move this stack
                    cubeStack = getStackCubes(acube, used, mycid, true);
                    //check stack for more than stack of 2 - meaning no stacking on top of stacks or move stacks on another
                    var anchorStack;
                    console.warn('$scope.opt.limStack', $scope.opt.limStack);
                    if ($scope.opt.limStack) {
                        if (!cubeStack.length) {
                            //don't check Y because this is the base stack where things will move to
                            //we also don't need to reference cube but by position
                            anchorStack = getStackCubes({ position: cubeDat.position, prop: { size: maxsize } }, used, null, false);
                            if (anchorStack.length < 2)
                                isRegen = false;
                            console.warn('gen itr', $scope.curState.block_states.length, mycid, cubeStack.length, cubeDat.anchorCid, anchorStack.length);
                        }
                    }
                    else
                        isRegen = false;
                }
                //remove cubes used from the world and leave world cubes in cidlist
                cidlist.splice(_.indexOf(cidlist, acube.prop.cid), 1);
                cubeStack.forEach(function (c) {
                    cidlist.splice(_.indexOf(cidlist, c.prop.cid), 1);
                });
                var basePos = { x: acube.position.x, y: acube.position.y, z: acube.position.z }; //store base Y
                acube.position = cubeDat.position;
                acube.position.y = acube.prop.size / 2; //translate it down to the ground
                /*acube.position.x = 0;
                 acube.position.z = 0;*/
                updateYCube(acube, cidlist, cubeInWorld);
                var delta = { x: acube.position.x - basePos.x, y: acube.position.y - basePos.y, z: acube.position.z - basePos.z };
                cubeStack.forEach(function (c) {
                    c.position.x += delta.x;
                    c.position.y += delta.y;
                    c.position.z += delta.z;
                });
                //rebuild frame and show
                for (var i = 0; i < block_state.length; i++) {
                    block_state[i].position = cubeInWorld[block_state[i].id].position;
                }
                showFrame({ block_state: block_state }, function () {
                    if (params.itr) {
                        //this is a iterate state generation so lets save the info
                        $scope.curcnt = params.itr + 1;
                        $scope.curitr = cstate + 1;
                        params.cubesused = cubesused;
                        setTimeout(function () {
                            waitForSSAndSave(params, nextItr(params));
                        }, 400);
                    }
                    else
                        $scope.$apply(function () {
                            toaster.pop('info', 'Generated Test Move');
                        });
                });
            }
            else
                $scope.$apply(function () { toaster.pop('error', 'Missing State ID'); });
        };
        /*$scope.showInitFrame = function(state:iCubeState[], cb:()=>void){
          $scope.resetWorld();
          console.warn('showInitFrame', state);
          setTimeout(function(){
            state.forEach(function(s){
              var c = get3DCubeById(s.prop.cid);
              c.position = new BABYLON.Vector3(s.position.x, s.position.y, s.position.z);
              c.isVisible = true;
              if(hasPhysics) c.setPhysicsState({
                impostor: BABYLON.PhysicsEngine.BoxImpostor,
                move: true,
                mass: 5, //c.boxsize,
                friction: fric,
                restitution: rest
              });
            })
            if(cb) cb();
          }, 100);
        };*/
        var showFrame = function (state, cb) {
            $scope.resetWorld();
            setTimeout(function () {
                if (state.block_state) {
                    state.block_state.forEach(function (frame) {
                        var c = get3DCubeById(frame.id);
                        c.position = new BABYLON.Vector3(frame.position['x'], frame.position['y'], frame.position['z']);
                        if (frame.rotation)
                            c.rotationQuaternion = new BABYLON.Quaternion(frame.rotation['x'], frame.rotation['y'], frame.rotation['z'], frame.rotation['w']);
                        c.isVisible = true;
                        if (hasPhysics)
                            c.setPhysicsState({
                                impostor: BABYLON.PhysicsEngine.BoxImpostor,
                                move: true,
                                mass: 5,
                                friction: fric,
                                restitution: rest
                            });
                    });
                }
                else
                    $scope.$apply(function () { toaster.pop('error', 'Missing BLOCK_STATE'); });
                if (cb)
                    cb();
            }, 100);
        };
        /*var findBy = function(type:string, key:string, collection:any){
          return _.find(collection, function(a){return key === a[type]});
        };*/
        var insertGen = function (used, cb) {
            /*var str = '';
            used.forEach(function(cid){
              var c = get3DCubeById(cid);
              str += cid + ':' + c.position.x + ':' + c.position.y + ':' + c.position.z+'\n';
            });
            var sig = md5.createHash(str);
            var mygstate = findBy('sig', sig, genstates);
            if(!mygstate){*/
            if (true) {
                //check if we loaded states or just a frame save for an existing system
                if (!$scope.curState._id && $scope.curState.block_states && $scope.curState.block_states.length
                    && $scope.curState.block_states[0].screencap) {
                    //if there is no id for current state, there are states in it and screencap then it must be a loadstates object
                    //we have to save everything in this state and save the screen caps in another value.
                    for (var i = 0; i < $scope.curState.block_states.length; i++)
                        ;
                    var saveScreen = function (idx, list, cb) {
                        if (_.isUndefined(list[idx]))
                            return cb();
                        screencaps.save({
                            data: list[idx].screencap,
                            created: (new Date).getTime(),
                            public: true
                        }).then(function (val) {
                            delete list[idx].screencap;
                            list[idx].screencapid = val[0]._id;
                            saveScreen(idx + 1, list, cb);
                        }, function (err) {
                            console.warn('saveScreen', err.reason);
                            cb(err);
                        });
                    };
                    saveScreen(0, $scope.curState.block_states, function (err) {
                        if (err)
                            return $scope.$apply(function () { toaster.pop('error', err.reason); });
                        genstates.save($scope.curState).then(function (val) {
                            $scope.curState._id = val[0]._id;
                            cb(null, $scope.curState._id);
                        }, function (err) {
                            cb(err.reason);
                        });
                    });
                }
                else {
                    var max = APP_CONST.fieldsize / 2 + 0.001; //give it a little wiggle room
                    var min = -max;
                    var frame = [];
                    var meta = { blocks: [] };
                    var isValid = true;
                    used.forEach(function (cid) {
                        var c = get3DCubeById(cid);
                        if (c) {
                            if ((c.position.x - c.boxsize / 2) >= min && (c.position.x + c.boxsize / 2) <= max &&
                                (c.position.z - c.boxsize / 2) >= min && (c.position.z + c.boxsize / 2) <= max) {
                                var dat = { id: cid, position: c.position.clone(), rotation: c.rotationQuaternion.clone() };
                                frame.push(dat);
                                meta.blocks.push(cubesdata[cid].meta);
                            }
                            else {
                                isValid = false;
                            }
                        }
                    });
                    if (!isValid) {
                        cb('Cube(s) Out of Bounds!');
                        return false;
                    }
                    BABYLON.Tools.CreateScreenshot(engine, camera, { width: canvas.width, height: canvas.height }, function (b64i) {
                        var b64img = LZString.compressToUTF16(b64i);
                        screencaps.save({
                            data: b64img,
                            created: (new Date).getTime(),
                            public: true
                        }).then(function (val) {
                            if (!$scope.curState.block_states)
                                $scope.curState.block_states = [];
                            $scope.curState.block_states.push({
                                block_state: frame,
                                screencapid: val[0]._id,
                                created: (new Date).getTime()
                            });
                            genstates.save($scope.curState).then(function (val) {
                                console.warn(val[0]);
                                $scope.curState._id = val[0]._id;
                                var attachid = createButtons('stateimg', $scope.curState.block_states.length - 1);
                                showImage(b64img, 'Move #: ' + ($scope.curState.block_states.length - 1), attachid);
                                cb(null, $scope.curState._id);
                            }, function (err) {
                                cb(err.reason);
                            });
                        }, function (err) {
                            cb(err.reason);
                        });
                    });
                }
            }
            else {
                cb('State already exists!');
            }
        };
        var showImage = function (b64i, text, attachID) {
            var b64img = LZString.decompressFromUTF16(b64i);
            var eleDivID = 'div' + $('div').length; // Unique ID
            var eleImgID = 'img' + $('img').length; // Unique ID
            //var eleLabelID:string = 'h4' + $('h4').length; // Unique ID
            var htmlout = '';
            if (text)
                htmlout += '<b>' + text + '</b><br>';
            htmlout += '<img id="' + eleImgID + '" style="width:' + canvas.width * 2 / 3 + 'px;height:' + canvas.height * 2 / 3 + 'px"></img>';
            // + '<label id="'+eleLabelID+'" class="mb"> '+id+'</label>';
            var attachTo = '#galleryarea';
            if (attachID)
                attachTo = '#' + attachID;
            $('<div>').attr({
                id: eleDivID
            }).addClass('col-sm-12')
                .html(htmlout).css({}).appendTo(attachTo);
            var img = document.getElementById(eleImgID); // Use the created element
            img.src = b64img;
        };
        var checkFnSS; //store steady state check
        /**
         * check for a scene steady state before saving data.
         * providing a cb will short circuit checks for startgen or startmove functions
         * @param params
         */
        var waitForSSAndSave = function (params, cb) {
            checkFnSS = setInterval(function () {
                if (isSteadyState) {
                    clearInterval(checkFnSS);
                    insertGen(params.cubesused, cb);
                }
            }, 200);
        };
        /**
         * start generation of cubes based on number of buces, iterations, and layout type
         *
         * @param ccnt
         * @param itr
         * @param cstate
         */
        $scope.startGen = function () {
            var state = [];
            var cubeidxdata = {};
            var cubesused = [];
            var myccnt = $scope.curState.block_meta.blocks.length;
            for (var i = 0; i < myccnt; i++) {
                var dat = genCubeState0(cubesused, cubeidxdata); //save used list
                state.push({ id: dat.prop.cid, position: dat.position });
            }
            if (cubesused.length != state.length)
                console.warn('done state!!', cubesused.length, state.length);
            $('#galleryarea').empty();
            createObjects($scope.curState.block_meta.blocks);
            $scope.curState.public = true;
            $scope.curState.created = (new Date).getTime();
            $scope.curState.creator = $rootScope.currentUser._id;
            showFrame({ block_state: state }, function () {
                checkFnSS = setInterval(function () {
                    if (isSteadyState) {
                        clearInterval(checkFnSS);
                        //check if all cubes are inside the bounds of the table
                        var max = APP_CONST.fieldsize / 2 + 0.001; //give it a little wiggle room
                        var min = -max;
                        var isValid = true;
                        var len = $scope.curState.block_meta.blocks.length;
                        for (var i = 0; i < len; i++) {
                            var cid = $scope.curState.block_meta.blocks[i].id;
                            var c = get3DCubeById(cid);
                            if (c) {
                                if (!((c.position.x - c.boxsize / 2) >= min && (c.position.x + c.boxsize / 2) <= max &&
                                    (c.position.z - c.boxsize / 2) >= min && (c.position.z + c.boxsize / 2) <= max)) {
                                    isValid = false; //fail time to restart the generation
                                    i = len;
                                }
                            }
                        }
                        if (!isValid)
                            $scope.startGen();
                        else
                            $scope.$apply(function () {
                                $scope.impFilename = 'system';
                                $scope.enableImpSave = true;
                            });
                    }
                }, 100);
            });
            /*
                  $scope.showInitFrame(state, function(){
                    var params = {cubesused: cubesused, creator: 'system'};
                    //we need to set a timeout before checking steading states or we get bad block layouts
                    setTimeout(function(){waitForSSAndSave(params, function(err, sid){
                      console.warn()
                    });}, 400);
                  });*/
        };
        /**
         * show the state to be used as state 0
         * @param sid
         */
        $scope.showState = function (sid) {
            $scope.enableImpSave = false;
            //we must get the state for this sid
            $scope.$meteorSubscribe("genstates", sid).then(function (sub) {
                var myframe = GenStates.findOne({ _id: sid });
                if (!myframe)
                    return toaster.pop('warn', 'Invalid State ID');
                //update the meta
                $scope.curitr = myframe.block_states.length - 1;
                $scope.curcnt = 0;
                $scope.curState.clear();
                $scope.curState.copy(myframe);
                createObjects($scope.curState.block_meta.blocks);
                showFrame(myframe.block_states[$scope.curitr]);
                function itrScreencap(idx, list, cb) {
                    if (_.isUndefined(list[idx]))
                        return cb();
                    var scid = list[idx].screencapid;
                    $scope.$meteorSubscribe("screencaps", scid).then(function (sub) {
                        var screen = ScreenCaps.findOne({ _id: scid });
                        var attachid = createButtons('stateimg', idx);
                        showImage(screen.data, 'Move #:' + idx, attachid);
                        itrScreencap(idx + 1, list, cb);
                    });
                }
                itrScreencap(0, myframe.block_states, function () { });
            });
        };
        var createButtons = function (id, i) {
            var lenID = $('div').length;
            var eleDivID = 'rowdiv' + lenID; // Unique ID
            var retId = id + lenID;
            var htmlout = '<button onclick="angular.element(this).scope().cloneMove(' + i + ')" class="btn btn-xs btn-info"> Clone Move </button>' +
                '    ' +
                '<button onclick="angular.element(this).scope().getMove(' + i + ')" class="btn btn-xs btn-info"> Get JSON </button>' +
                '    ' +
                '<button onclick="angular.element(this).scope().delMove(' + i + ')" class="btn btn-xs btn-info"> Delete Move(s) </button>' +
                '<div id="' + retId + '"></div>';
            var attachTo = '#galleryarea';
            $('<div>').attr({
                id: eleDivID
            }).addClass('col-sm-4')
                .html(htmlout).css({ "border-bottom": '1px solid #e4eaec' }).appendTo(attachTo);
            return retId;
        };
        $scope.remState = function (sid) {
            if (sid) {
                $scope.$meteorSubscribe("genstates", sid).then(function (sub) {
                    var myframe = GenStates.findOne({ _id: sid });
                    myframe.block_states.forEach(function (s) {
                        screencaps.remove(s.screencapid);
                    });
                    genstates.remove(sid);
                    updateTableStateParams();
                    toaster.pop('warning', 'Removed ' + sid);
                });
            }
        };
        var getStackCubes = function (mycube, used, cid, checkY) {
            var retStack = [];
            for (var i = 0; i < used.length; i++) {
                if (!cid || cid != used[i].prop.cid) {
                    var c = used[i];
                    if (intersectsMeshXYZ(mycube, c, checkY)) {
                        retStack.push(c);
                    }
                }
            }
            return retStack;
        };
        /*$scope.myreplay = null;
        $scope.frameid = -1;
        var showReplay = function(idx){
          var frameScene = $scope.myreplay.data.act[idx];
          frameScene.forEach(function(frame){
            var cube = cubesnamed[frame.name];
            cube.position = new BABYLON.Vector3(frame.position.x, frame.position.y, frame.position.z);
            cube.rotationQuaternion = new BABYLON.Quaternion(frame.rotation.x, frame.rotation.y, frame.rotation.z, frame.rotation.w);
            cube.isVisible = true;
          })
        };*/
        $scope.enableImpSave = false;
        $scope.cancelImport = function () {
            //must use function to apply to scope
            $scope.impFilename = null;
            $scope.enableImpSave = false;
            $scope.curState.clear();
            $scope.resetWorld();
        };
        $scope.saveImport = function (savename) {
            $scope.impFilename = null;
            $scope.enableImpSave = false;
            var cubesused = [];
            $scope.curState.block_meta.blocks.forEach(function (b) {
                cubesused.push(b.id);
            });
            cubesused = _.uniq(cubesused);
            $scope.curState.name = savename;
            console.warn('saveImport');
            var params = { itr: 0, startMove: null, cubesused: cubesused };
            setTimeout(function () {
                waitForSSAndSave(params, function (err, savedsid) {
                    console.warn('saveimpor wait for');
                    if (err)
                        toaster.pop('warn', err);
                    if (savedsid) {
                        $scope.curitr = $scope.curState.stateitr;
                        $scope.curcnt = 0;
                        updateTableStateParams();
                    }
                });
            }, 400);
        };
        $scope.clearMeta = function () {
            $('#galleryarea').empty();
            $scope.curState.clear();
        };
        $scope.loadMeta = function () {
            if ($scope.metafilename && $scope.metafilename.length) {
                //read file
                var reader = new FileReader();
                reader.onload = function () {
                    var filedata = JSON.parse(reader.result);
                    if (filedata.blocks && filedata.blocks.length) {
                        $scope.$apply(function () {
                            $scope.curState.clear();
                            $scope.curState.block_meta = filedata;
                            createObjects($scope.curState.block_meta.blocks);
                        });
                    }
                    else
                        $scope.$apply(function () { toaster.pop('warn', 'Invalid JSON META file'); });
                };
                reader.readAsText($scope.metafilename[0]);
            }
        };
        $scope.metaFileChanged = function (event) {
            $scope.$apply(function () { $scope.metafilename = event.target.files; });
            console.warn($scope.metafilename);
        };
        /**
         * loads a json state file with the CURRENT state iteration set to 0
         */
        $scope.loadState = function () {
            if ($scope.statefilename && $scope.statefilename.length) {
                //read file
                var reader = new FileReader();
                reader.onload = function () {
                    var filedata = JSON.parse(reader.result);
                    if (filedata.block_state && filedata.block_state.length
                        && filedata.block_meta && filedata.block_meta.blocks && filedata.block_meta.blocks.length) {
                        if (filedata.block_meta.blocks.length != filedata.block_state.length)
                            return $scope.$apply(function () {
                                toaster.pop('error', 'Block META and STATE mismatch!');
                            });
                        $scope.curState.clear();
                        $scope.curState.block_meta = filedata.block_meta;
                        $scope.curState.public = true;
                        $scope.curState.created = (new Date).getTime();
                        $scope.curState.creator = $rootScope.currentUser._id;
                        console.warn($scope.curState.block_meta);
                        createObjects($scope.curState.block_meta.blocks);
                        //mung block_state
                        //filedata.block_state = mungeBlockState(filedata.block_state);
                        var block_state = mungeBlockState(filedata.block_state);
                        showFrame({ block_state: block_state }, function () {
                            $scope.$apply(function () {
                                if (filedata.name)
                                    $scope.impFilename = filedata.name;
                                else
                                    $scope.impFilename = $scope.statefilename[0].name.toLowerCase().replace(/\.json/g, '');
                                $scope.enableImpSave = true;
                            });
                        });
                    }
                    else
                        $scope.$apply(function () { toaster.pop('warn', 'Invalid JSON STATE file'); });
                };
                reader.readAsText($scope.statefilename[0]);
            }
        };
        $scope.stateFileChanged = function (event) {
            $scope.$apply(function () { $scope.statefilename = event.target.files; });
            console.warn($scope.statefilename);
        };
        $scope.loadStates = function () {
            if ($scope.statesfilename && $scope.statesfilename.length) {
                //read file
                var reader = new FileReader();
                reader.onload = function () {
                    var filedata = JSON.parse(reader.result);
                    if (filedata.block_states && filedata.block_states.length
                        && filedata.block_meta && filedata.block_meta.blocks && filedata.block_meta.blocks.length) {
                        if (filedata.block_meta.blocks.length != filedata.block_states[0].block_state.length)
                            return $scope.$apply(function () {
                                toaster.pop('error', 'Block META and STATE mismatch!');
                            });
                        $scope.curState.clear();
                        $scope.curState.block_meta = filedata.block_meta;
                        $scope.curState.public = true;
                        $scope.curState.created = (new Date).getTime();
                        $scope.curState.creator = $rootScope.currentUser._id;
                        console.warn($scope.curState.block_meta);
                        createObjects($scope.curState.block_meta.blocks);
                        //mung block_states
                        $scope.curState.block_states = mungeBlockStates(filedata.block_states);
                        var itrFrame = function (idx, block_states, cb) {
                            if (_.isUndefined(block_states[idx])) {
                                $scope.$apply(function () {
                                    if (filedata.name)
                                        $scope.impFilename = filedata.name;
                                    else
                                        $scope.impFilename = $scope.statesfilename[0].name.toLowerCase().replace(/\.json/g, '');
                                    $scope.enableImpSave = true;
                                });
                                return cb();
                            }
                            showFrame(block_states[idx], function () {
                                //wait for steady state
                                checkFnSS = setInterval(function () {
                                    if (isSteadyState) {
                                        clearInterval(checkFnSS);
                                        var sc = BABYLON.Tools.CreateScreenshot(engine, camera, {
                                            width: canvas.width, height: canvas.height
                                        }, function (b64i) {
                                            var b64img = LZString.compressToUTF16(b64i);
                                            /*console.warn('len', b64i.length, b64img.length);
                                            console.warn('b64i', b64i);
                                            console.warn('b64img', LZString.decompressFromUTF16(b64img));*/
                                            block_states[idx].screencap = b64img;
                                            block_states[idx].created = (new Date).getTime();
                                            var attachid = createButtons('stateimg', idx);
                                            showImage(b64img, 'Move #: ' + idx, attachid);
                                            itrFrame(idx + 1, block_states, cb);
                                        });
                                    }
                                }, 100);
                            });
                        };
                        itrFrame(0, $scope.curState.block_states, function () {
                            console.warn($scope.curState.block_states);
                        });
                    }
                    else
                        $scope.$apply(function () { toaster.pop('warn', 'Invalid JSON STATE file'); });
                };
                reader.readAsText($scope.statesfilename[0]);
            }
        };
        $scope.statesFileChanged = function (event) {
            $scope.$apply(function () { $scope.statesfilename = event.target.files; });
            console.warn($scope.statesfilename);
        };
        var mungeBlockStates = function (bss) {
            var newbss = [];
            for (var i = 0; i < bss.length; i++) {
                newbss.push({ block_state: mungeBlockState(bss[i].block_state) });
            }
            return newbss;
        };
        /**
         * Transform text block state from cwic to internal block states
         * @param bs
         * @returns {Array}
         */
        var mungeBlockState = function (bs) {
            var newBS = [];
            bs.forEach(function (b) {
                var li = b.position.split(',');
                var lv = [];
                li.forEach(function (v, i) { lv.push(Number(v)); });
                if (b.rotation) {
                    var ri = b.rotation.split(',');
                    var rv = [];
                    ri.forEach(function (v, i) {
                        rv.push(Number(v));
                    });
                    newBS.push({ id: b.id, position: {
                            x: lv[0], y: lv[1], z: lv[2]
                        }, rotation: {
                            x: rv[0], y: rv[1], z: rv[2], w: rv[3]
                        } });
                }
                else
                    newBS.push({ id: b.id, position: {
                            x: lv[0], y: lv[1], z: lv[2]
                        } });
            });
            return newBS;
        };
        $scope.startMove = function (itr) {
            console.warn(itr);
            itr = Number(itr);
            $scope.isgen = true;
            var params = { itr: itr, startMove: $scope.startMove, cubesused: null };
            $scope.genStateN(params);
        };
        var nextItr = function (params) {
            return function (err, savedsid) {
                if (err)
                    toaster.pop('warn', err);
                if (savedsid) {
                    if (params.itr > 1) {
                        //if(params.startGen) params.startGen(params.itr - 1);
                        if (params.startMove)
                            params.startMove(params.itr - 1);
                    }
                    else {
                        $scope.curitr = 0;
                        $scope.curcnt = 0;
                        $scope.isgen = false;
                    }
                }
                else {
                    //don't iterate since we had error with previous insert
                    //which means we need to make a new init state
                    //if(params.startGen) params.startGen(params.itr);
                    if (params.startMove)
                        params.startMove(params.itr);
                }
            };
        };
        $scope.cloneMove = function (idx) {
            var prevState = _.extend({}, $scope.curState);
            $scope.curState.clear();
            $scope.curState.block_meta = prevState.block_meta;
            $scope.curState.public = true;
            $scope.curState.created = (new Date).getTime();
            $scope.curState.creator = $rootScope.currentUser._id;
            $('#galleryarea').empty();
            createObjects($scope.curState.block_meta.blocks);
            showFrame(prevState.block_states[idx], function () {
                $scope.$apply(function () {
                    if (prevState.name)
                        $scope.impFilename = prevState.name;
                    $scope.enableImpSave = true;
                });
            });
        };
        $scope.dlScene = function () {
            var tempframe = { _id: $scope.curState._id,
                public: $scope.curState.public, name: $scope.curState.name, created: $scope.curState.created,
                creator: $scope.curState.creator, block_meta: $scope.curState.block_meta, block_states: [] };
            for (var idx = 0; idx < $scope.curState.block_states.length; idx++) {
                var block_state = $scope.curState.block_states[idx].block_state;
                var newblock_state = [];
                for (var i = 0; i < block_state.length; i++) {
                    var s = block_state[i];
                    var pos = '', rot = '';
                    _.each(s.position, function (v) {
                        if (pos.length)
                            pos += ',';
                        pos += v;
                    });
                    _.each(s.rotation, function (v) {
                        if (rot.length)
                            rot += ',';
                        rot += v;
                    });
                    newblock_state.push({ id: s.id, position: pos, rotation: rot });
                }
                tempframe.block_states.push({ block_state: newblock_state });
            }
            var content = JSON.stringify(tempframe, null, 2);
            var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
            apputils.saveAs(uriContent, 'bw_scene_' + $scope.curState._id + '.json');
        };
        $scope.getMove = function (idx) {
            var tempframe = { block_meta: $scope.curState.block_meta, block_state: [] };
            var block_state = $scope.curState.block_states[idx].block_state;
            for (var i = 0; i < block_state.length; i++) {
                var s = block_state[i];
                var pos = '', rot = '';
                _.each(s.position, function (v) {
                    if (pos.length)
                        pos += ',';
                    pos += v;
                });
                _.each(s.rotation, function (v) {
                    if (rot.length)
                        rot += ',';
                    rot += v;
                });
                tempframe.block_state.push({ id: s.id, position: pos, rotation: rot });
            }
            var content = JSON.stringify(tempframe, null, 2);
            var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
            apputils.saveAs(uriContent, 'bw_state_' + $scope.curState._id + '_' + idx + '.json');
        };
        $scope.delMove = function (idx) {
            var count = $scope.curState.block_states.length - idx;
            $scope.curState.block_states.splice(idx, count);
            genstates.save($scope.curState).then(function (val) {
                $scope.clearMeta();
                $scope.showState(val[0]._id);
            }, function (err) {
                console.warn(err.reason);
            });
        };
        // Start by calling the createScene function that you just finished creating
        var scene;
        var grid;
        createWorld();
        dataReady.update('world created');
    }]);
//# sourceMappingURL=gen-world-view.js.map