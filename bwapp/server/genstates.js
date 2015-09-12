/**========================================================
 * Module: genstates.js
 * Created by wjwong on 9/11/15.
 =========================================================*/

GenStates.allow({
  insert: function(userId, replay){
    var fcheck = _.without(_.keys(replay), 'idkey', 'public', 'frame', 'prev', 'next', 'cubecnt', 'init');
    if(fcheck.length) throw new Match.Error("illegal fields:" + JSON.stringify(fcheck));
    return userId;
  },
  update: function(userId, replay, fields, modifier){
    var fcheck = _.without(_.keys(replay), 'idkey', 'public', 'frame', 'prev', 'next', 'cubecnt', 'init');
    if(fcheck.length) throw new Match.Error("illegal fields:" + JSON.stringify(fcheck));
    return userId;
  },
  remove: function(userId, replay){
    return userId;
  },
  fetch: ['idkey']
});

Meteor.publish('genstates', function(){
  return GenStates.find({
    $or: [
      {
        $and: [
          {'public': true},
          {'public': {$exists: true}}
        ]
      }
      /*,
       {$and: [
       {owner: this.userId},
       {owner: {$exists: true}}
       ]}*/
    ]
  });
});
