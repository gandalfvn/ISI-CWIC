/**========================================================
 * Module: cmdmoveshelper
 * Created by wjwong on 1/29/16.
 =========================================================*/
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/meteor-typescript-libs/definitions/meteorhacks-npm.d.ts" />
/// <reference path="./util.ts" />

interface iCmdLocEle{id: number, loc: number[]}
interface iCmdSerial{
  world: iCmdLocEle[],
  input?: string,
  version: number,
  error?: string
}

Meteor.methods({
  cmdMovePost: function (data:iCmdSerial) {
    var idx:number = rndInt(0, data.world.length-1);
    var movetype:number = rndInt(0,3);
    var move:iCmdLocEle = data.world[idx];
    switch(movetype){
      case 0:
        move.loc[0] += 0.1;
        break;
      case 1:
        move.loc[0] -= 0.1;
        break;
      case 2:
        move.loc[2] += 0.1;
        break;
      case 3:
        move.loc[2] -= 0.1;
        break;
    }
    
    var retdat:iCmdSerial = {
      world: [move]
      , version: 1
    };
    var cmdPost = Async.runSync(function (done) {
      var rest:any = Meteor['npmRequire']('restler');
      /*rest.postJson('http://localhost:8080/api/texttosong', data).on('complete', function (dat, res) {
        done(null, dat);
      })*/
      done(null, retdat);
    });

    return cmdPost
  }
});
