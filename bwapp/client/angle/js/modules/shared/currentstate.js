/**
 * Created by wjwong on 11/5/15.
 */
/// <reference path="../../../../../server/typings/underscore/underscore.d.ts" />
cCurrentState = (function () {
    function cCurrentStateDef(c) {
        if (c)
            this.copy(c);
    }
    cCurrentStateDef.prototype.clear = function () {
        for (var i = 0; i < cCurrentStateDef.l.length; i++) {
            this[cCurrentStateDef.l[i]] = null;
        }
        if (!_.isUndefined(this._id))
            delete this['_id'];
    };
    ;
    cCurrentStateDef.prototype.copy = function (s) {
        for (var i = 0; i < cCurrentStateDef.l.length; i++) {
            this[cCurrentStateDef.l[i]] = s[cCurrentStateDef.l[i]];
        }
    };
    ;
    cCurrentStateDef.l = ['block_meta', 'block_states', '_id', 'public', 'created', 'creator', 'name'];
    return cCurrentStateDef;
})();
//# sourceMappingURL=currentstate.js.map