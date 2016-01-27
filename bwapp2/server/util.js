/**========================================================
 * Module: util
 * Created by wjwong on 1/26/16.
 =========================================================*/
/// <reference path="./typings/meteor/meteor.d.ts" />
isRole = function (usr, role) {
    if (usr) {
        if (role == 'guest') {
            if (usr && usr.profile && usr.profile.guest)
                return usr.profile.guest;
        }
        else if (usr && usr.profile && usr.profile.roles)
            return (usr.profile.roles.indexOf(role) > -1);
    }
    return false;
};
//# sourceMappingURL=util.js.map