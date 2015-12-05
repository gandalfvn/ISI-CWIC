/**
 * Created by wjwong on 12/4/15.
 */
/// <reference path="../../../../../model/genstatesdb.ts" />
/// <reference path="../../../../../public/vendor/babylonjs/babylon.2.2.d.ts" />
var miGen3DEngine;
(function (miGen3DEngine) {
    var c3DEngine = (function () {
        function c3DEngine(fieldsize) {
            this.hasPhysics = true;
            this.rest = 0.2;
            this.fric = 0.1;
            this.opt = {
                showGrid: false,
                showImages: true,
                showLogos: true
            };
            // Get the canvas element from our HTML above
            this.canvas = document.getElementById("renderCanvasBab");
            this.numTextures = new Array(21);
            this.cubeslist = [];
            this.cubesdata = {};
            this.numcubes = 0;
            this.cubecolors = ['red', 'blue', 'green', 'cyan', 'magenta', 'yellow'];
            this.cubenames = ['adidas', 'bmw', 'burger king', 'coca cola', 'esso', 'heineken', 'hp', 'mcdonalds', 'mercedes benz', 'nvidia', 'pepsi', 'shell', 'sri', 'starbucks', 'stella artois', 'target', 'texaco', 'toyota', 'twitter', 'ups'];
            this.colorids = {};
            this.cubesize = {
                s: 1,
                m: 2,
                l: 3
            };
            this.colorids['red'] = BABYLON.Color3.FromInts(255, 0, 0);
            this.colorids['blue'] = BABYLON.Color3.FromInts(0, 0, 255);
            this.colorids['magenta'] = BABYLON.Color3.FromInts(200, 0, 200);
            this.colorids['yellow'] = BABYLON.Color3.FromInts(255, 255, 0);
            this.colorids['cyan'] = BABYLON.Color3.FromInts(34, 181, 191);
            this.colorids['purple'] = BABYLON.Color3.FromInts(135, 103, 166);
            this.colorids['green'] = BABYLON.Color3.FromInts(0, 255, 0);
            this.colorids['orange'] = BABYLON.Color3.FromInts(233, 136, 19);
            this.fieldsize = fieldsize;
        }
        /**
         * Create Dynamic number textures for use in cubes
         */
        c3DEngine.prototype.createNumTexture = function (scene) {
            for (var i = 0; i < this.numTextures.length; i++) {
                this.numTextures[i] = new BABYLON.DynamicTexture("dynamic texture", 256, scene, true);
                this.numTextures[i].drawText(i.toString(), 32, 128, "bold 140px verdana", "black", "#aaaaaa");
            }
        };
        ;
        /**
         * Create cubes based on size s m l and color
         * data: size, color scene, pos (position)
         * @param data
         */
        c3DEngine.prototype.createCube = function (data) {
            var block = data.block;
            var boxsize = block.shape.shape_params.side_length;
            var objdesc = block.name + '_' + block.shape.type + '_' + boxsize;
            var objname = objdesc + '_' + block.id;
            var boxcolor = this.colorids['orange'];
            var boxmat = new BABYLON.StandardMaterial(objname, data.scene);
            //boxmat.diffuseTexture.hasAlpha = true;
            //boxmat.specularColor = BABYLON.Color3.Black();
            boxmat.alpha = 1.0;
            //boxmat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
            var faceCol = new Array(6);
            if (this.opt.showImages) {
                var boxt;
                if (this.opt.showLogos)
                    boxt = new BABYLON.Texture("img/textures/logos/" + block.name.replace(/ /g, '') + '.png', this.scene);
                else
                    boxt = this.numTextures[block.id];
                boxt.uScale = 1;
                boxt.vScale = 1;
                boxt.wAng = Math.PI / 2;
                boxmat.diffuseTexture = boxt;
                for (var i = 0; i < 6; i++) {
                    var cv = this.colorids[block.shape.shape_params['face_' + (i + 1)].color];
                    faceCol[i] = new BABYLON.Color4(cv.r, cv.g, cv.b, 1);
                }
            }
            else {
                var cv = this.colorids['yellow'];
                for (var i = 0; i < 6; i++) {
                    faceCol[i] = new BABYLON.Color4(cv.r, cv.g, cv.b, 1);
                }
            }
            //boxmat.diffuseColor = boxcolor;
            //boxmat.alpha = 0.8;
            /*var hSpriteNb =  14;  // 6 sprites per raw
             var vSpriteNb =  8;  // 4 sprite raws
             var faceUV = new Array(6);
             for (var i = 0; i < 6; i++) {
             faceUV[i] = new BABYLON.Vector4(0/hSpriteNb, 0, 1/hSpriteNb, 1 / vSpriteNb);
             }*/
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
            this.numcubes++;
            this.cubesdata[block.id] = { objidx: this.cubeslist.length, meta: block };
            this.cubeslist.push(box);
        };
        ;
        c3DEngine.prototype.isZeroVec = function (vect3) {
            if (vect3.x < -0.001 || vect3.x > 0.001)
                return false;
            if (vect3.y < -0.001 || vect3.y > 0.001)
                return false;
            if (vect3.z < -0.001 || vect3.z > 0.001)
                return false;
            return true;
        };
        ;
        // This begins the creation of a function that we will 'call' just after it's built
        c3DEngine.prototype.createScene = function () {
            // Now create a basic Babylon Scene object
            var scene = new BABYLON.Scene(this.engine);
            this.oimo = new BABYLON.OimoJSPlugin();
            scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), this.oimo);
            // Change the scene background color to green.
            scene.clearColor = new BABYLON.Color3(0, 0, 0.5);
            scene.collisionsEnabled = true;
            scene.workerCollisions = true;
            //  Create an ArcRotateCamera aimed at 0,0,0, with no alpha, beta or radius, so be careful.  It will look broken.
            this.camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 0, 0, this.fieldsize, new BABYLON.Vector3(0, 0, 0), scene);
            // Quick, let's use the setPosition() method... with a common Vector3 position, to make our camera better aimed.
            this.camera.setPosition(new BABYLON.Vector3(0, this.fieldsize * 0.95, -(this.fieldsize * 0.8)));
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
            scene.activeCamera = this.camera;
            scene.activeCamera.attachControl(this.canvas);
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
            if (this.hasPhysics)
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
            var tableboxsize = this.fieldsize;
            this.table = BABYLON.Mesh.CreateBox("table", tableboxsize, scene);
            this.table.boxsize = tableboxsize;
            this.table.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
            this.table.position.y = 0;
            this.table.scaling.y = 0.001;
            this.table.onCollide = function (a) {
                console.warn('oncollide table', a);
            };
            this.table.material = tablemat; //gridshader;
            if (this.hasPhysics)
                this.table.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, move: false });
            this.table.checkCollisions = true;
            this.table.receiveShadows = true;
            if (this.opt.showGrid) {
                var gridmat = new BABYLON.StandardMaterial("grid", scene);
                gridmat.wireframe = true; //create wireframe
                gridmat.diffuseColor = BABYLON.Color3.Gray();
                this.grid = BABYLON.Mesh.CreateGround("grid", this.fieldsize, this.fieldsize, 6, scene, false); //used to show grid
                this.grid.position.y = 0.01;
                this.grid.scaling.y = 0.001;
                this.grid.material = gridmat;
            }
            var animate = function () {
                var self = this;
                this.isSteadyState = true;
                this.cubeslist.forEach(function (c) {
                    //count the number of 0 move ticks
                    if (c.oldpos) {
                        var delta = c.oldpos.subtract(c.position);
                        if (self.isZeroVec(delta)) {
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
                                this.isSteadyState = false;
                        }
                        else {
                            c.material.emissiveColor = new BABYLON.Color3(0.176, 0.85, 0.76);
                            c.isMoving = true;
                            this.isSteadyState = false;
                        }
                    }
                    c.oldpos = c.position.clone();
                });
            };
            scene.registerBeforeRender(animate.bind(this));
            // Leave this function
            return scene;
        };
        ;
        c3DEngine.prototype.updateRender = function (scene) {
            return function () {
                scene.render();
            };
        };
        ;
        c3DEngine.prototype.createWorld = function () {
            var self = this;
            // Load the BABYLON 3D engine
            self.engine = new BABYLON.Engine(this.canvas);
            // Now, call the createScene function that you just finished creating
            self.scene = self.createScene();
            //create dynamic number textures
            self.createNumTexture(self.scene);
            // Register a render loop to repeatedly render the scene
            self.engine.runRenderLoop(self.updateRender(self.scene));
            // Watch for browser/canvas resize events
            window.addEventListener("resize", function () {
                self.engine.resize();
            });
        };
        ;
        c3DEngine.prototype.createObjects = function (blocks) {
            if (this.cubeslist.length)
                this.cubeslist.forEach(function (c) {
                    if (this.hasPhysics)
                        this.oimo.unregisterMesh(c); //stop physics
                    c.dispose();
                });
            this.cubeslist.length = 0;
            this.cubesdata = {};
            this.numcubes = 0;
            var p = -2;
            var i = 0;
            var z = 0;
            var zpos = [0, 1, 2];
            for (var j = 0; j < blocks.length; j++) {
                this.createCube({
                    pos: new BABYLON.Vector3((p + i), blocks[j].shape.shape_params.side_length, zpos[z]),
                    scene: this.scene,
                    block: blocks[j],
                    isVisible: true
                });
                if (i > 3) {
                    i = 0;
                    z++;
                }
                else
                    i++;
            }
            this.cubesid = Object.keys(this.cubesdata);
        };
        ;
        c3DEngine.prototype.get3DCubeById = function (cid) {
            return this.cubeslist[this.cubesdata[cid].objidx];
        };
        ;
        c3DEngine.prototype.resetWorld = function () {
            var c;
            var p = -2, i = 0, z = 0;
            var zpos = [7, 8, 9, 10];
            for (var j = 0; j < this.cubeslist.length; j++) {
                c = this.cubeslist[j];
                if (this.hasPhysics)
                    this.oimo.unregisterMesh(c); //stop physics
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
            this.camera.setPosition(new BABYLON.Vector3(0, this.fieldsize * 0.95, -(this.fieldsize * 0.8)));
        };
        /**
         * Overlap check for src inside tgt mesh in the x z footprint
         * @param src
         * @param tgt
         * @returns {boolean}
         */
        c3DEngine.prototype.intersectsMeshXYZ = function (src, tgt, checkY) {
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
        ;
        return c3DEngine;
    })();
    miGen3DEngine.c3DEngine = c3DEngine;
})(miGen3DEngine || (miGen3DEngine = {}));
mGen3DEngine = miGen3DEngine;
//# sourceMappingURL=gen-3d-engine.js.map