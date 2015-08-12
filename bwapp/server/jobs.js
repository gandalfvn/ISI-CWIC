/**========================================================
 * Module: jobs.js
 * Created by wjwong on 8/11/15.
 =========================================================*/

Jobs.allow({
  insert: function(userId, job){
    return userId && job.owner === userId;
  },
  update: function(userId, job, fields, modifier){
    return userId && job.owner === userId;
  },
  remove: function(userId, job){
    return userId && job.owner === userId;
  }
});

Meteor.publish('jobs', function(){
  return Jobs.find({
    $and: [
     {owner: this.userId},
     {owner: {$exists: true}}
    ]
  });
});

