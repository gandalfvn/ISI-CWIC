/**========================================================
 * Module: blockreplays.js
 * Created by wjwong on 8/7/15.
 =========================================================*/

BlockReplays = new Mongo.Collection('blockreplays');

BlockReplays.allow({
  insert: function(userId, replay){
    return userId && replay.owner === userId;
  },
  update: function(userId, replay, fields, modifier){
    return userId && replay.owner === userId;
  },
  remove: function(userId, replay){
    return userId && replay.owner === userId;
  }
});
