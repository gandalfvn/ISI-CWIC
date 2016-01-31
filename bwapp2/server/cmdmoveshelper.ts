/**========================================================
 * Module: cmdmoveshelper
 * Created by wjwong on 1/29/16.
 =========================================================*/
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/meteor-typescript-libs/definitions/meteorhacks-npm.d.ts" />

interface iCmdLocEle{id: number, loc: number[]}
interface iCmdSerial{
  world: iCmdLocEle[],
  input?: string,
  version: number,
  error?: string
}

Meteor.methods({
  cmdMovePost: function (data) {
    var retdat:iCmdSerial = {
      world: [
        {
          "id": 1,
          "loc": [-0.1667, 0.1, -0.3333]
        }
      ]
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
