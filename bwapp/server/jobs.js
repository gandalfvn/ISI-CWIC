/**========================================================
 * Module: jobs.js
 * Created by wjwong on 8/11/15.
 =========================================================*/

Meteor.publish('jobs', function(){
  return Jobs.find({
    $and: [
     {owner: this.userId},
     {owner: {$exists: true}}
    ]
  });
});

