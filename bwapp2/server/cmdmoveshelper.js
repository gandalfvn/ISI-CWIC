/**========================================================
 * Module: cmdmoveshelper
 * Created by wjwong on 1/29/16.
 =========================================================*/
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/meteor-typescript-libs/definitions/meteorhacks-npm.d.ts" />
/// <reference path="./util.ts" />
Meteor.methods({
    cmdMovePost: function (data) {
        var idx = rndInt(0, data.world.length - 1);
        var movetype = rndInt(0, 3);
        var move = data.world[idx];
        switch (movetype) {
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
        var retdat = {
            world: [move],
            version: 1
        };
        var cmdPost = Async.runSync(function (done) {
            var rest = Meteor['npmRequire']('restler');
            /*rest.postJson('http://localhost:8080/api/texttosong', data).on('complete', function (dat, res) {
              done(null, dat);
            })*/
            done(null, retdat);
        });
        return cmdPost;
    }
});
//# sourceMappingURL=cmdmoveshelper.js.map