/**========================================================
 * Module: stateslist.js
 * Created by wjwong on 9/16/15.
 =========================================================*/

StatesList.allow({
  insert: function(userId, data){
    var fcheck = _.without(_.keys(data), '_id', 'stateid', 'list', 'public', 'created', 'near', 'far');
    if(fcheck.length) throw new Match.Error("illegal fields:" + JSON.stringify(fcheck));
    return userId;
  },
  update: function(userId, data, fields, modifier){
    var fcheck = _.without(_.keys(data), '_id', 'stateid', 'list', 'public', 'created', 'near', 'far');
    if(fcheck.length) throw new Match.Error("illegal fields:" + JSON.stringify(fcheck));
    return userId;
  },
  remove: function(userId, data){
    return userId;
  },
  fetch: ['_id']
});

Meteor.publish('stateslist', function(){
  return StatesList.find({
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
  },{
    //fields: {'_id': 1, 'idkey': 1}
  });
});
