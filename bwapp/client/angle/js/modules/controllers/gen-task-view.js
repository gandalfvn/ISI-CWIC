/**========================================================
 * Module: gen-task-view.ts
 * Created by wjwong on 10/5/15.
 =========================================================*/
/// <reference path="../../../../../model/genjobsmgrdb.ts" />
/// <reference path="../../../../../model/genstatesdb.ts" />
/// <reference path="../../../../../model/screencapdb.ts" />
/// <reference path="../../../../../public/vendor/lz-string/typings/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/underscore/underscore.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../services/apputils.ts" />
//?taskid=2kw6CqcqjRzsHBWD2&assignmentId=123RVWYBAZW00EXAMPLE456RVWYBAZW00EXAMPLE&hitId=123RVWYBAZW00EXAMPLE&turkSubmitTo=https://www.mturk.com/&workerId=AZ3456EXAMPLE
angular.module('angle').controller('genTaskCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', 'AppUtils', function ($rootScope, $scope, $state, $stateParams, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, apputils) {
        "use strict";
        $scope.date = (new Date()).getTime();
        var genstates = $scope.$meteorCollection(GenStates);
        $scope.$meteorSubscribe("genstates").then(function (sid) { dataReady.update('genstates'); }, function (err) { console.log("error", arguments, err); });
        var screencaps = $scope.$meteorCollection(ScreenCaps);
        $scope.$meteorSubscribe("screencaps").then(function (sid) { dataReady.update('screencaps'); }, function (err) { console.log("error", arguments, err); });
        var genjobsmgr = $scope.$meteorCollection(GenJobsMgr);
        $scope.$meteorSubscribe("genjobsmgr").then(function (sid) { dataReady.update('genjobsmgr'); }, function (err) { console.log("error", arguments, err); });
        $scope.isOpenDir = true;
        $scope.taskdata;
        $scope.taskidx = 0;
        $scope.notes = null;
        var dataReady = new apputils.cDataReady(2, function () {
            var isAdminUser = ($rootScope.currentUser) ? $rootScope.isRole($rootScope.currentUser, 'admin') : false;
            if ($stateParams.report && !isAdminUser) {
                $rootScope.dataloaded = true;
                return;
            }
            if ($stateParams.taskId) {
                $scope.taskdata = GenJobsMgr.findOne($stateParams.taskId);
                if (!$scope.taskdata) {
                    $rootScope.dataloaded = true;
                    $scope.assignmentId = null;
                    return;
                }
                $scope = _.extend($scope, $stateParams);
                if ($scope.turkSubmitTo)
                    $scope.submitTo = $scope.turkSubmitTo + '/mturk/externalSubmit';
                //if($stateParams.workerId) $scope.workerId = $stateParams.workerId;
                //if($stateParams.assignmentId) $scope.assignmentId = $stateParams.assignmentId;
                if ($scope.workerId === 'EXAMPLE')
                    $scope.submitter = true;
                var isValid = true;
                if ($scope.hitId) {
                    //load hit
                    $scope.hitdata = GenJobsMgr.findOne('H_' + $scope.hitId);
                    if ($scope.hitdata && $scope.hitdata.submitted && isValid && $scope.workerId && $scope.workerId !== 'EXAMPLE') {
                        var subfound = _.findWhere($scope.hitdata.submitted, { name: $scope.workerId });
                        if (!_.isUndefined(subfound)) {
                            //worker already submitted
                            $scope.submitter = subfound;
                        }
                    }
                }
                var sid = $scope.taskdata.stateid;
                $scope.$meteorSubscribe("genstates", sid).then(function (sub) {
                    $scope.curState = GenStates.findOne(sid);
                    //console.warn('curState',$scope.curState);
                    $scope.taskidx = 0;
                    if ($stateParams.report) {
                        $scope.report = $stateParams.report;
                        if ($scope.hitdata.notes[$scope.workerId]) {
                            $timeout(function () {
                                renderReport(0);
                            });
                        }
                        else {
                            $rootScope.dataloaded = true;
                            toaster.pop('error', 'Missing annotations');
                        }
                    }
                    else {
                        if (isValid)
                            renderTask($scope.taskidx);
                        $scope.logolist = [];
                        console.warn($scope.curState.block_meta);
                        _.each($scope.curState.block_meta.blocks, function (b) {
                            $scope.logolist.push({ name: b.name, imgref: "img/textures/logos/" + b.name.replace(/ /g, '') + '.png' });
                        });
                        console.warn($scope.logolist);
                    }
                    /*Meteor.call('mturkReviewableHITs', {hid: $scope.hitId},  function(err, resp){
                     console.warn(err,resp);
                     })*/
                }, function (err) {
                    console.warn('err', err);
                    $scope.$apply(function () {
                        toaster.pop('error', sid + ' Not Found', err.reason);
                    });
                });
            }
        });
        var renderReport = function (idx) {
            if (_.isUndefined($scope.taskdata.idxlist[idx])) {
                $rootScope.dataloaded = true;
                return;
            }
            if ($scope.taskdata.tasktype == 'action') {
                var aidx = $scope.taskdata.idxlist[idx][0];
                var bidx = $scope.taskdata.idxlist[idx][1];
                $('#statea' + idx).empty();
                $('#stateb' + idx).empty();
                var scids = [$scope.curState.block_states[aidx].screencapid, $scope.curState.block_states[bidx].screencapid];
                $scope.$meteorSubscribe('screencaps', scids).then(function (sub) {
                    var screena = ScreenCaps.findOne(scids[0]);
                    var screenb = ScreenCaps.findOne(scids[1]);
                    showImage(screena.data, 'Before', null, 'statea' + idx);
                    showImage(screenb.data, 'After', null, 'stateb' + idx);
                    renderReport(idx + 1);
                });
            }
        };
        var renderTask = function (idx) {
            //create the annotations
            if ($scope.hitdata) {
                if (!$scope.hitdata.notes)
                    $scope.hitdata.notes = {};
                if (!$scope.hitdata.notes[$scope.workerId])
                    $scope.hitdata.notes[$scope.workerId] = {};
                if (!$scope.hitdata.notes[$scope.workerId][idx]) {
                    $scope.hitdata.notes[$scope.workerId][idx] = [];
                    for (var i = 0; i < $scope.taskdata.antcnt; i++)
                        $scope.hitdata.notes[$scope.workerId][idx].push('');
                }
                $scope.notes = $scope.hitdata.notes[$scope.workerId][idx];
            }
            else {
                $scope.notes = [];
                for (var i = 0; i < $scope.taskdata.antcnt; i++)
                    $scope.notes.push('');
            }
            if ($scope.taskdata.tasktype == 'action') {
                var aidx = $scope.taskdata.idxlist[idx][0];
                var bidx = $scope.taskdata.idxlist[idx][1];
                $('#statea').empty();
                $('#stateb').empty();
                var scids = [$scope.curState.block_states[aidx].screencapid, $scope.curState.block_states[bidx].screencapid];
                $scope.$meteorSubscribe('screencaps', scids).then(function (sub) {
                    var screena = ScreenCaps.findOne(scids[0]);
                    var screenb = ScreenCaps.findOne(scids[1]);
                    showImage(screena.data, 'Before', null, 'statea');
                    showImage(screenb.data, 'After', null, 'stateb');
                    $rootScope.dataloaded = true;
                });
            }
        };
        var showImage = function (b64i, title, caption, attachID) {
            if (!attachID)
                return console.warn('Missing dom attach id');
            var canvas = { width: 480, height: 360 };
            var b64img = LZString.decompressFromUTF16(b64i);
            var eleDivID = 'div' + $('div').length; // Unique ID
            var eleImgID = 'img' + $('img').length; // Unique ID
            var eleLabelID = 'h4' + $('h4').length; // Unique ID
            var htmlout = '<img id="' + eleImgID + '" style="width:' + canvas.width + 'px;height:' + canvas.height + 'px"></img>';
            if (title)
                htmlout = '<h4>' + title + '</h4>' + htmlout;
            if (caption)
                htmlout += '<label id="' + eleLabelID + '" class="mb">' + caption + '</label>';
            $('<div>').attr({
                id: eleDivID
            }).addClass('col-sm-7')
                .html(htmlout).css({}).appendTo('#' + attachID);
            var img = document.getElementById(eleImgID); // Use the created element
            img.src = b64img;
        };
        $scope.itrAnnot = function (notes, vdir) {
            var previdx = $scope.taskidx;
            $scope.taskidx += vdir;
            if ($scope.taskidx != 0)
                $scope.isOpenDir = false;
            else
                $scope.isOpenDir = true;
            $rootScope.dataloaded = false;
            if ($scope.submitter) {
                //read only submission already done
                if ($scope.taskidx >= $scope.taskdata.idxlist.length)
                    $scope.taskidx = 0;
                renderTask($scope.taskidx);
            }
            else {
                if ($scope.hitId) {
                    //error check length
                    var fixedNotes = _.compact(notes);
                    if (!fixedNotes.length || fixedNotes.length != notes.length) {
                        toaster.pop('error', 'All entries must be filled.');
                        return;
                    }
                    fixedNotes = _.uniq(fixedNotes);
                    if (!fixedNotes.length || fixedNotes.length != notes.length) {
                        toaster.pop('error', 'Each description my be different.');
                        return;
                    }
                    if (!$scope.hitdata.timed)
                        $scope.hitdata.timed = {};
                    if (!$scope.hitdata.timed[$scope.workerId])
                        $scope.hitdata.timed[$scope.workerId] = {};
                    if (!$scope.hitdata.timed[$scope.workerId][previdx])
                        $scope.hitdata.timed[$scope.workerId][previdx] = (new Date()).getTime();
                    //must use update instead of save because _id is custom generated
                    var setdata = {};
                    setdata['notes.' + $scope.workerId] = $scope.hitdata.notes[$scope.workerId];
                    setdata['timed.' + $scope.workerId] = $scope.hitdata.timed[$scope.workerId];
                    GenJobsMgr.update({ _id: $scope.hitdata._id }, {
                        $set: setdata
                    }, function (err, ret) {
                        if (err)
                            return toaster.pop('error', err.reason);
                        if ($scope.taskidx >= $scope.taskdata.idxlist.length && $scope.assignmentId && $scope.assignmentId != 'ASSIGNMENT_ID_NOT_AVAILABLE') {
                            //submission assignment as done
                            if (!$scope.hitdata.submitted)
                                $scope.hitdata.submitted = [];
                            var subfound = _.findWhere($scope.hitdata.submitted, { name: $scope.workerId });
                            if (_.isUndefined(subfound)) {
                                $scope.hitdata.submitted.push({
                                    name: $scope.workerId,
                                    time: (new Date()).getTime(),
                                    aid: $scope.assignmentId,
                                    submitto: $scope.turkSubmitTo
                                });
                                $scope.submitter = $scope.hitdata.submitted[$scope.hitdata.submitted.length - 1];
                                $scope.taskidx = 0;
                                GenJobsMgr.update({ _id: $scope.hitdata._id }, {
                                    $addToSet: {
                                        submitted: $scope.submitter
                                    }
                                }, function (err, ret) {
                                    console.warn('hit', err, ret);
                                    if (err)
                                        return toaster.pop('error', err);
                                    toaster.pop('info', 'HIT Task Submitted');
                                    $('form[name="submitForm"]').submit(); //submit to turk
                                });
                            }
                        }
                        else
                            renderTask($scope.taskidx);
                    });
                }
                else
                    toaster.pop('error', 'Missing HIT Id');
            }
        };
        $scope.dlScene = function () {
            var tempframe = { _id: $scope.curState._id,
                public: $scope.curState.public, name: $scope.curState.name, created: $scope.curState.created,
                creator: $scope.curState.creator, block_meta: $scope.curState.block_meta, block_states: [] };
            for (var idx = 0; idx < $scope.curState.block_states.length; idx++) {
                var block_state = $scope.curState.block_states[idx].block_state;
                var newblock_state = [];
                for (var i = 0; i < block_state.length; i++) {
                    var s = block_state[i];
                    var pos = '', rot = '';
                    _.each(s.position, function (v) {
                        if (pos.length)
                            pos += ',';
                        pos += v;
                    });
                    _.each(s.rotation, function (v) {
                        if (rot.length)
                            rot += ',';
                        rot += v;
                    });
                    newblock_state.push({ id: s.id, position: pos, rotation: rot });
                }
                tempframe.block_states.push({ block_state: newblock_state });
            }
            var content = JSON.stringify(tempframe, null, 2);
            var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
            apputils.saveAs(uriContent, 'bw_scene_' + $scope.curState._id + '.json');
        };
        $scope.dlStates = function () {
            var content = JSON.stringify($scope.taskdata, null, 2);
            var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
            apputils.saveAs(uriContent, 'bw_states_' + $scope.taskdata._id + '.json');
        };
        $scope.dlNotes = function () {
            var content = JSON.stringify($scope.hitdata, null, 2);
            var uriContent = "data:application/octet-stream," + encodeURIComponent(content);
            apputils.saveAs(uriContent, 'bw_notes_' + $scope.hitdata.HITId + '.json'); //+'_'+$scope.workerId+'.json');
        };
    }]);
//# sourceMappingURL=gen-task-view.js.map