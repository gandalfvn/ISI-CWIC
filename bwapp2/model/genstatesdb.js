/**========================================================
 * Module: genstatesdb.js
 * Created by wjwong on 9/11/15.
 =========================================================*/
/// <reference path="../server/typings/meteor/meteor.d.ts" />
cBlockDecor = (function () {
    function cBlockDecorDef() {
    }
    cBlockDecorDef.digit = 'digit';
    cBlockDecorDef.logo = 'logo';
    cBlockDecorDef.blank = 'blank';
    return cBlockDecorDef;
})();
GenStates = new Mongo.Collection('genstates');
//# sourceMappingURL=genstatesdb.js.map