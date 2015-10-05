/**========================================================
 * Module: genjobs.js
 * Created by wjwong on 10/3/15.
 =========================================================*/

GenJobs.allow({
  insert: function(userId, job){
    return userId && job.owner === userId;
  },
  update: function(userId, job, fields, modifier){
    return userId && (job.owner === userId);
  },
  remove: function(userId, job){
    return userId && job.owner === userId;
  },
  fetch: ['owner']
});

Meteor.publish('genjobs', function(){
  return GenJobs.find({
    /*$and: [
     {owner: this.userId},
     {owner: {$exists: true}}
     ]*/
  });
});
