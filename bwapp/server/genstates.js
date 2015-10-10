/**========================================================
 * Module: genstates.js
 * Created by wjwong on 9/11/15.
 =========================================================*/

GenStates.allow({
  insert: function(userId, data){
    var fcheck = _.without(_.keys(data), '_id', 'public', 'block_meta', 'block_state', 'prev', 'next', 'cubecnt', 'init', 'screencap', 'created', 'name', 'creator', 'stateitr');
    if(fcheck.length) throw new Match.Error("illegal fields:" + JSON.stringify(fcheck));
    return userId;
  },
  update: function(userId, data, fields, modifier){
    var fcheck = _.without(_.keys(data), '_id', 'public', 'block_meta', 'block_state', 'prev', 'next', 'cubecnt', 'init', 'screencap', 'created', 'name', 'creator', 'stateitr');
    if(fcheck.length) throw new Match.Error("illegal fields:" + JSON.stringify(fcheck));
    return userId;
  },
  remove: function(userId, data){
    return userId;
  }
  ,fetch: ['_id']
});

Meteor.publish('genstates', function(id){
  if(id){
    return GenStates.find({
      $and: [
      {
        $and: [
          {'public': true},
          {'public': {$exists: true}}
        ]
      }
      ,{'_id': id}
    ]});
  }
  else return GenStates.find({
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
    },
    {fields: {'_id': 1, 'stateitr': 1, 'next': 1}}
  );
});

Meteor.publish('genstatesGallery', function(){
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
  },{fields: {'_id': 1, 'cubecnt': 1, 'screencap': 1}});
});
