/**========================================================
 * Module: genjobsmgr.js
 * Created by wjwong on 10/3/15.
 =========================================================*/
/// <reference path="../model/genjobsmgrdb.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/underscore/underscore.d.ts" />

GenJobsMgr.allow({
  insert: function(userId: string, job): string{
    //console.warn('insert');
    return userId; // && job.owner === userId;
  },
  update: function(userId: string, job, fields, modifier): string{
    if(userId) return userId;
    else{
      var idx = '$set';
      var delkeys:string[] = [];
      //only allow pass through of updates to notes and submitted
      if(modifier['$set']){
        var keys:string[] = Object.keys(modifier['$set']);
        _.each(keys, function(k){
          if(!(k.match(/notes/g) || k.match(/timed/g))) delkeys.push(k);
        });
        //keys = _.difference(keys, ['notes', 'submitted', 'timed']); //only allow notes and submitted when not logged in
      }
      else{
        if(modifier['$addToSet']){
          idx = '$addToSet';
          var keys:string[] = Object.keys(modifier['$addToSet']);
          var delkeys:string[] = [];
          _.each(keys, function(k){
            if(!k.match(/submitted/g)) delkeys.push(k);
          });
        }
        else return null;
      }
      
      if(delkeys.length) console.warn('GenJobsMgr '+idx+' del: ');
      for(var i = 0; i < delkeys.length; i++){
        console.warn(delkeys[i]);
        delete modifier[idx][delkeys[i]];
      }

      return 'anonymous';
    }
  },
  remove: function(userId: string, job): string{
    return userId; // && job.owner === userId;
  }
  //,fetch: ['owner']
});

Meteor.publish('genjobsmgr', function(param?: {type: string}){
  if(param){
    //todo: not used so far
    switch(param.type){
      case 'submitted':
        return GenJobsMgr.find(
          {$and: [{HITId: {$exists: true}}, {submitted: {$exists: true}}]}
          , {fields: {tid: 1, submitted: 1}}
          , {sort: {'submitted.time': -1}}
        );
        break;
    }
  }
  else return GenJobsMgr.find({
      /*$and: [
       {owner: this.userId},
       {owner: {$exists: true}}
       ]*/
    }
    //, {fields: {'_id': 1, 'islist': 1}}
  );
});


