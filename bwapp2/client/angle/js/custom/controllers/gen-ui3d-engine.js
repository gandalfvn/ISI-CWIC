/**
 * Created by wjwong on 12/15/15.
 */
/// <reference path="gen-3d-engine.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/*ignoring Error:(6, 27) TS2507: Type 'any' is not a constructor function type.
because mgen3dengine is the content of the interface of migen3dengine.  This was only way to get modules to work
 */
var cUI3DEngine = (function (_super) {
    __extends(cUI3DEngine, _super);
    function cUI3DEngine(fieldsize) {
        _super.call(this, fieldsize);
    }
    return cUI3DEngine;
})(mGen3DEngine.c3DEngine);
//# sourceMappingURL=gen-ui3d-engine.js.map