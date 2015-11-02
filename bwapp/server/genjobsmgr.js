/**========================================================
 * Module: genjobsmgr.js
 * Created by wjwong on 10/3/15.
 =========================================================*/

GenJobsMgr.allow({
  insert: function(userId, job){
    //console.warn('insert');
    return userId; // && job.owner === userId;
  },
  update: function(userId, job, fields, modifier){
    if(userId) return userId;
    else{
      //only allow pass through of updates to notes and submitted
      var keys = Object.keys(modifier['$set']);
      keys = _.difference(keys, ['notes', 'submitted', 'timed']); //only allow notes and submitted when not logged in
      if(keys.length) console.warn('GenJobsMgr del: ');
      for(var i = 0; i < keys.length; i++){
        console.warn(keys[i]);
        delete modifier['$set'][keys[i]];
      }
      return true;
    }
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

