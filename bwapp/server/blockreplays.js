/**========================================================
 * Module: blockreplays
 * Created by wjwong on 8/7/15.
 =========================================================*/
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

Meteor.publish('blockreplays', function(){
  return BlockReplays.find({
    $or: [
      {$and: [
        {'public': true},
        {'public': {$exists: true}}
      ]},
      {$and: [
        {owner: this.userId},
        {owner: {$exists: true}}
      ]}
    ]
  });
});
