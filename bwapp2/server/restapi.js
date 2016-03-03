/**
 * Created by wjwong on 12/5/15.
 */
/// <reference path="../model/genjobsmgrdb.ts" />
/// <reference path="../model/genstatesdb.ts" />
/// <reference path="../model/screencapdb.ts" />
/// <reference path="../model/gencmdjobsdb.ts" />
/// <reference path="../model/gencmdsdb.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/lz-string/lz-string.d.ts" />
HTTP['methods']({
    '/api/hit/:id': {
        get: function () {
            return GenJobsMgr.findOne('H_' + this.params.id);
        }
    },
    '/api/task/:id': {
        get: function () {
            return GenJobsMgr.findOne(this.params.id);
        }
    },
    '/api/state/:id': {
        get: function () {
            return GenStates.findOne(this.params.id);
        }
    },
    '/api/screencap/:id': {
        get: function () {
            var sc = ScreenCaps.findOne(this.params.id);
            var b64img = LZString.decompressFromUTF16(sc.data);
            return b64img;
        }
    },
    '/api/cmd/hit/:id': {
        get: function () {
            return GenCmdJobs.findOne('H_' + this.params.id);
        }
    },
    '/api/cmd/task/:id': {
        get: function () {
            return GenCmdJobs.findOne(this.params.id);
        }
    },
    '/api/cmd/state/:id': {
        get: function () {
            return GenCmds.findOne(this.params.id);
        }
    }
});
//# sourceMappingURL=restapi.js.map