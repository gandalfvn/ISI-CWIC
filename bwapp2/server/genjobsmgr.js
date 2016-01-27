/**========================================================
 * Module: genjobsmgr.js
 * Created by wjwong on 10/3/15.
 =========================================================*/
/// <reference path="./typings/meteor/meteor.d.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="../model/genjobsmgrdb.ts" />
/// <reference path="./util.ts" />
GenJobsMgr.allow({
    insert: function (userId, job) {
        //console.warn('insert');
        if (isRole(Meteor.user(), 'guest'))
            return false;
        return userId; // && job.owner === userId;
    },
    update: function (userId, job, fields, modifier) {
        if (isRole(Meteor.user(), 'guest')) {
            var idx = '$set';
            var delkeys = [];
            //only allow pass through of updates to notes and submitted
            if (modifier['$set']) {
                var keys = Object.keys(modifier['$set']);
                _.each(keys, function (k) {
                    if (!(k.match(/notes/g) || k.match(/timed/g)))
                        delkeys.push(k);
                });
            }
            else {
                if (modifier['$addToSet']) {
                    idx = '$addToSet';
                    var keys = Object.keys(modifier['$addToSet']);
                    var delkeys = [];
                    _.each(keys, function (k) {
                        if (!k.match(/submitted/g))
                            delkeys.push(k);
                    });
                }
                else
                    return null;
            }
            if (delkeys.length)
                console.warn('GenJobsMgr ' + idx + ' del: ');
            for (var i = 0; i < delkeys.length; i++) {
                console.warn(delkeys[i]);
                delete modifier[idx][delkeys[i]];
            }
        }
        return userId;
    },
    remove: function (userId, job) {
        if (isRole(Meteor.user(), 'guest'))
            return false;
        return userId; // && job.owner === userId;
    }
});
Meteor.publish('genjobsmgr', function (param) {
    if (param) {
        //todo: not used so far
        switch (param.type) {
            case 'submitted':
                return GenJobsMgr.find({ $and: [{ HITId: { $exists: true } }, { submitted: { $exists: true } }] }, { fields: { tid: 1, submitted: 1 } }, { sort: { 'submitted.time': -1 } });
                break;
        }
    }
    else
        return GenJobsMgr.find({});
});
//# sourceMappingURL=genjobsmgr.js.map