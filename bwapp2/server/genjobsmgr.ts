/**========================================================
 * Module: genjobsmgr.js
 * Created by wjwong on 10/3/15.
 =========================================================*/
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="../model/genjobsmgrdb.ts" />
/// <reference path="./util.ts" />

GenJobsMgr.allow({
  insert: function(userId, job){
    //console.warn('insert');
    if(isRole(Meteor.user(), 'guest')) return false;
    return userId; // && job.owner === userId;
  },
  update: function(userId, job, fields, modifier){
    if(isRole(Meteor.user(), 'guest')){
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
    }
    return userId;
  },
  remove: function(userId, job){
    if(isRole(Meteor.user(), 'guest')) return false;
    return userId; // && job.owner === userId;
  }
  //,fetch: ['owner']
});

Meteor.publish('genjobsmgr', function(params?: {type: string}){
  if(params){
    //todo: not used so far
    switch(params.type){
      case 'submitted':
        return GenJobsMgr.find(
          {$and: [{HITId: {$exists: true}}, {submitted: {$exists: true}}]}
          , {fields: {tid: 1, submitted: 1}}
          , {sort: {'submitted.time': -1}}
        );
        break;
      case 'list':
        return GenJobsMgr.find(
          {}
          , {sort: {'created': -1}, skip: params['pageSize'] * params['pageCur'], limit: params['pageSize']}
        );
/*
        return GenJobsMgr.find(
          {HITId: {$exists: true}}
          , {fields: {tid: 1, jid: 1, 'submitted.name': 1, 'submitted.valid': 1, 'submitted.time': 1, 'hitcontent.MaxAssignments': 1, 'hitcontent.Reward': 1, 'created': 1, 'islive': 1}, sort: {'created': -1}, skip: params['pageSize'] * params['pageCur'], limit: params['pageSize']}
        );*/
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


