/**========================================================
 * Module: genjobsmgr.js
 * Created by wjwong on 10/3/15.
 =========================================================*/

GenJobsMgr.allow({
  insert: function(userId, job){
    return userId; // && job.owner === userId;
  },
  update: function(userId, job, fields, modifier){
    return userId; // && (job.owner === userId);
  },
  remove: function(userId, job){
    return userId; // && job.owner === userId;
  }
  //,fetch: ['owner']
});

Meteor.publish('genjobsmgr', function(){
  return GenJobsMgr.find({
      /*$and: [
       {owner: this.userId},
       {owner: {$exists: true}}
       ]*/
    }
    //, {fields: {'_id': 1, 'islist': 1}}
  );
});

