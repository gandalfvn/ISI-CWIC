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

interface iIds {
  _id: string,
  created: number,
  name?: string
}

HTTP['methods']({
  '/api/hit/:id': {
    get: function() {
      return <miGenJobsMgr.iGenJobsHIT>GenJobsMgr.findOne('H_' + this.params.id);
    }
  },
  '/api/hit/ids': {
    get: function() {
      return <iIds[]>GenJobsMgr.find({_id: {$in: [/^H\_/]}}, {sort: {"_id": 1}, fields:{_id:1, created:1}}).fetch();
    }
  },
  '/api/task/:id': {
    get: function() {
      return <miGenJobsMgr.iGenJobsMgr>GenJobsMgr.findOne(this.params.id);
    }
  },
  '/api/task/ids': {
    get: function() {
      return <iIds[]>GenJobsMgr.find({_id: {$nin: [/^H\_/]}}, {sort: {"_id": 1}, fields:{_id:1, created:1}}).fetch();
    }
  },
  '/api/state/:id': {
    get: function() {
      return <iGenStates>GenStates.findOne(this.params.id);
    }
  },
  '/api/state/ids':{
    get: function() {
      return <iIds[]>GenStates.find({}, {sort: {"_id": 1}, fields:{_id:1, created:1, name:1}}).fetch();
    }
  },
  '/api/screencap/:id': {
    get: function() {
      var sc = <iScreenCaps>ScreenCaps.findOne(this.params.id);
      var b64img:string = LZString.decompressFromUTF16(sc.data);
      return b64img;
    }
  },
  '/api/screencap/ids': {
    get: function() {
      return <iIds[]>ScreenCaps.find({}, {sort: {"_id": 1}, fields:{_id:1, created:1}}).fetch();
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
  }
});

