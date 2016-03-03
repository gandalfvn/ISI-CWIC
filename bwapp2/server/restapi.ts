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
    get: function() {
      return <miGenJobsMgr.iGenJobsHIT>GenJobsMgr.findOne('H_' + this.params.id);
    }
  },
  '/api/task/:id': {
    get: function() {
      return <miGenJobsMgr.iGenJobsMgr>GenJobsMgr.findOne(this.params.id);
    }
  },
  '/api/state/:id': {
    get: function() {
      return <iGenStates>GenStates.findOne(this.params.id);
    }
  },
  '/api/screencap/:id': {
    get: function() {
      var sc = <iScreenCaps>ScreenCaps.findOne(this.params.id);
      var b64img:string = LZString.decompressFromUTF16(sc.data);
      return b64img;
    }
  },
  '/api/cmd/hit/:id': {
    get: function() {
      return <miGenCmdJobs.iGenJobsHIT>GenCmdJobs.findOne('H_' + this.params.id);
    }
  },
  '/api/cmd/task/:id': {
    get: function() {
      return <miGenCmdJobs.iGenCmdJobs>GenCmdJobs.findOne(this.params.id);
    }
  },
  '/api/cmd/state/:id': {
    get: function() {
      return <iGenCmds>GenCmds.findOne(this.params.id);
    }
  },


});

