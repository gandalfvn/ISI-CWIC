/**========================================================
 * Module: cmdmoveshelper
 * Created by wjwong on 1/29/16.
 =========================================================*/
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/meteor-typescript-libs/definitions/meteorhacks-npm.d.ts" />
/// <reference path="./util.ts" />
/// <reference path="../model/gencmdjobsdb.ts" />

var validRetKeys:string[] = ['world', 'error', 'version'];

Meteor.methods({
  cmdMovePost: function (data:miGenCmdJobs.iCmdSerial) {
    //console.warn(JSON.stringify(data));
    if(false){
      var idx:number = rndInt(0, data.world.length-1);
      var movetype:number = rndInt(0,3);
      var move:miGenCmdJobs.iCmdLocEle = data.world[idx];
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

      var hackretdat:miGenCmdJobs.iCmdSerial = {
        world: [move]
        , type: mGenCmdJobs.eCmdType.AI
        , version: 1
      };
      //hackretdat.error = "ERROR here!!";
      var cmdPost = Async.runSync(function (done) {
        done(null, hackretdat);
      });
    }
    else{
      var cmdPost = Async.runSync(function (done) {
        var rest:any = Meteor['npmRequire']('restler');
        rest.postJson('http://54.173.185.25:8080/query', data).on('complete', function (dat, res) {
          var retdat:miGenCmdJobs.iCmdSerial = {world: null, error: null, version: 0, type: mGenCmdJobs.eCmdType.AI};
          _.each(validRetKeys, function(k){
            retdat[k] = dat[k];
          });
          if(retdat.error && retdat.error.toLowerCase() == "null") retdat.error = null;
          done(null, retdat);
        });
      });
    }
    
    return cmdPost
  }
});
