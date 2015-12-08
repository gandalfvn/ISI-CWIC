/**
 * Created by wjwong on 12/5/15.
 */
/// <reference path="../model/genjobsmgrdb.ts" />
/// <reference path="../model/genstatesdb.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />

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
  }

});

