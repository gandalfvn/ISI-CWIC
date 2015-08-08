/**========================================================
 * Module: blockreplays
 * Created by wjwong on 8/7/15.
 =========================================================*/

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
