/**========================================================
 * Module: gencmdjobsdb
 * Created by wjwong on 2/5/16.
 =========================================================*/
/// <reference path="../server/typings/meteor/meteor.d.ts" />
var miGenCmdJobs;
(function (miGenCmdJobs) {
    (function (eRepValid) {
        eRepValid[eRepValid["no"] = 0] = "no";
        eRepValid[eRepValid["yes"] = 1] = "yes";
        eRepValid[eRepValid["tbd"] = 2] = "tbd";
    })(miGenCmdJobs.eRepValid || (miGenCmdJobs.eRepValid = {}));
    var eRepValid = miGenCmdJobs.eRepValid;
})(miGenCmdJobs || (miGenCmdJobs = {}));
GenCmdJobs = new Mongo.Collection('gencmdjobs');
mGenCmdJobs = miGenCmdJobs;
//# sourceMappingURL=gencmdjobsdb.js.map