/**========================================================
 * Module: gen-jobs-view.ts
 * Created by wjwong on 9/23/15.
 =========================================================*/
/// <reference path="../../../../../model/genjobsmgrdb.ts" />
/// <reference path="../../../../../model/genstatesdb.ts" />
/// <reference path="../../../../../model/screencapdb.ts" />
/// <reference path="../../../../../public/vendor/lz-string/typings/lz-string.d.ts" />
/// <reference path="../../../../../server/typings/underscore/underscore.d.ts" />
/// <reference path="../../../../../server/typings/meteor/meteor.d.ts" />
/// <reference path="../../../../../server/typings/jquery/jquery.d.ts" />
/// <reference path="../../../../../server/typings/angularjs/angular.d.ts" />
/// <reference path="../../../../../server/mturkhelper.ts" />
/// <reference path="../services/apputils.ts" />

angular.module('angle').controller('genJobsCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', 'AppUtils', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, apputils){
  "use strict";

  var canvas = {width: 480, height: 360};
  $scope.dtOptionsAvail = {
    "lengthMenu": [[5], [5]],
    "order": [[3, "desc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  $scope.dtOptionsGrp = {
    "lengthMenu": [[10], [10]],
    "order": [[2, "desc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  $scope.dtOptionsTask = {
    "lengthMenu": [[10], [10]],
    "order": [[0, "desc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  var genstates = $scope.$meteorCollection(GenStates);
  $scope.$meteorSubscribe("genstates").then(
    function(sid){dataReady.update('genstates');},
    function(err){ console.log("error", arguments, err); }
  );

  var screencaps = $scope.$meteorCollection(ScreenCaps);
  $scope.$meteorSubscribe("screencaps").then(
    function(sid){dataReady.update('screencaps');},
    function(err){ console.log("error", arguments, err); }
  );

  var genjobsmgr = $scope.$meteorCollection(GenJobsMgr);
  $scope.$meteorSubscribe("genjobsmgr").then(
    function(sid){dataReady.update('genjobsmgr');},
    function(err){ console.log("error", arguments, err); }
  );
  
  var dataReady:iDataReady = new apputils.cDataReady(2, function():void{
    $rootScope.dataloaded = true;
    updateTableStateParams();
    updateJobMgr();
    updateHITs();
  });

  var updateHITs = function(){
    $scope.doneASNs = getDoneASNs();
    $scope.allHITs = getAllHITs();
  };
  
  interface iSortHITs {
    time: number, 
    name?: string, 
    names?: string[],
    tid: string, hid: string, islive: boolean
  }

  var getDoneASNs = function(): iSortHITs[]{
    var jobs:iGenJobsHIT[] = GenJobsMgr.find(
      {$and: [{HITId: {$exists: true}}, {submitted: {$exists: true}}]}
      , {fields: {tid: 1, 'submitted.name': 1, 'submitted.time': 1, 'islive': 1}}
      , {sort: {'submitted.time': -1}}
    ).fetch();
    var sortedjobs = [];
    _.each(jobs, function(j){
      j.submitted.forEach(function(h){
        sortedjobs.push({time: h.time, name: h.name, tid: j.tid, hid: j._id.split('_')[1], islive: j.islive})
      })
    });
    if(sortedjobs.length)
      return sortedjobs.sort(function(a:{time: number},b:{time: number}):number{return a.time - b.time});
    return null;
  };

  var getAllHITs= function(): {active: iSortHITs[], done: iSortHITs[]}{
    var jobs:iGenJobsHIT[] = GenJobsMgr.find(
      {HITId: {$exists: true}}
      , {fields: {tid: 1, 'submitted.name': 1, 'submitted.time': 1, 'hitcontent.MaxAssignments': 1, 'created': 1, 'islive': 1}}
      , {sort: {'created': -1}}
    ).fetch();
    var activeHITs = [];
    var doneHITs = [];
    _.each(jobs, function(j){
      var asnleft = (j.hitcontent) ? (j.submitted) ? j.hitcontent.MaxAssignments - j.submitted.length : j.hitcontent.MaxAssignments : -1;
      var names = null;
      if(j.submitted){
        names = [];
        j.submitted.forEach(function(h){
          names.push(h.name);
        })
      }
      if(asnleft)
        activeHITs.push({time: j.created, names: names, tid: j.tid, hid: j._id.split('_')[1], asnleft: asnleft, islive: j.islive});
      else
        doneHITs.push({time: j.created, names: names, tid: j.tid, hid: j._id.split('_')[1], asnleft: asnleft, islive: j.islive});
    });
    if(activeHITs.length || doneHITs.length) {
      if (activeHITs.length)
        activeHITs.sort(function (a:{time: number}, b:{time: number}):number {
          return a.time - b.time
        });
      if (doneHITs.length)
        doneHITs.sort(function (a:{time: number}, b:{time: number}):number {
          return a.time - b.time
        });
      return {active: activeHITs, done: doneHITs}
    }
    return null;
  };

  $scope.dlLinks = function(task:iSortHITs){
    console.warn(task);
    var content:string[] = [];
    content.push('Example:');
    content.push($state.href('gentask',{taskId: task.tid, assignmentId: 'ASSIGNMENT_ID_NOT_AVAILABLE', workerId: 'EXAMPLE'}, {absolute: true}));
    content.push('Results:');
    _.each(task.names, function(n){
      content.push($state.href('gentask',{taskId: task.tid, workerId: n, hitId: task.hid, report: 1}, {absolute: true}));
    });
    
    var uriContent:string = "data:application/octet-stream," + encodeURIComponent(content.join('\n'));
    console.warn(uriContent);
    apputils.saveAs(uriContent, 'bw_links_'+task.tid+'.txt');
  };

  var updateTableStateParams = function(){
    $scope.stateslist = GenStates.find({}, {sort: {"_id": 1}}).fetch();
  };

  $scope.curState = new apputils.cCurrentState();

  $scope.remState = function(sid:string){
    if(sid){
      genstates.remove(sid);
      updateTableStateParams();
      toaster.pop('warning', 'Removed ' + sid);
    }
  };

  $scope.chooseState = function(sid:string){
    $scope.enableImpSave = false;
    //we must get the state for this sid
    $scope.$meteorSubscribe("genstates", sid).then(
      function(sub){
        var myframe:iGenStates = GenStates.findOne({_id: sid});
        if(!myframe) return $scope.$apply(function(){toaster.pop('warn', 'Invalid State ID')});
        $scope.curState.clear();
        $scope.curState.copy(myframe);
        $scope.showMove(0);
      }
    )
  };

  $scope.showMove = function(i:number){
    $('#imgpreview').empty();
    var scid:string = $scope.curState.block_states[i].screencapid;
    $scope.$meteorSubscribe('screencaps', scid).then(
      function(sub){
        var retid:string = navImgButtons('imgpreview', i);
        var screen:iScreenCaps = ScreenCaps.findOne({_id: scid});
        showImage(screen.data, 'Move #: '+i, retid);
      }
    );
  };

  var navImgButtons = function(id:string, i:number):string{
    var lenID:number = $('div').length;
    var eleDivID:string = 'rowdiv' + lenID; // Unique ID
    var retId:string = id+lenID;
    var htmlout = '';
    if(i < $scope.curState.block_states.length-1)
      htmlout += '<button onclick="angular.element(this).scope().showMove('+(i+1)+')" class="btn btn-xs btn-info pull-right" style="margin-left: 6px"> &gt; </button>';
    if(i > 0)
      htmlout += '<button onclick="angular.element(this).scope().showMove('+(i-1)+')" class="btn btn-xs btn-info pull-right"> &lt; </button>';
    htmlout += '<div id="'+retId+'"></div>';
    var attachTo = '#'+id;
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-12')
      .html(htmlout).css({"border-bottom": '1px solid #e4eaec'}).appendTo(attachTo);
    return retId;
  };

  var showImage = function(b64i:string, text:string, attachID:string){
    if(!attachID) return console.warn('showImage missing attachID');
    var b64img = LZString.decompressFromUTF16(b64i);

    var eleDivID:string = 'div' + $('div').length; // Unique ID
    var eleImgID:string = 'img' + $('img').length; // Unique ID
    //var eleLabelID:string = 'h4' + $('h4').length; // Unique ID
    var htmlout:string = '';
    if(text) htmlout += '<b>'+text+'</b><br>';
    htmlout += '<img id="'+eleImgID+'" style="width:'+canvas.width*4/5+'px;height:'+canvas.height*4/5+'px"></img>';
    // + '<label id="'+eleLabelID+'" class="mb"> '+id+'</label>';
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-4')
      .html(htmlout).css({}).appendTo('#'+attachID);

    var img:HTMLImageElement = <HTMLImageElement>document.getElementById(eleImgID); // Use the created element
    img.src = b64img;
  };

  $scope.taskGen = function(tasktype:string, movedir:string, bundle:number, asncnt:number, antcnt:number){
    var statelist:string[] = apputils.mdbArray(GenStates, {}, {
      sort: {"_id": 1}}, "_id");
    console.warn(statelist);
    if(statelist.length){
      var jobdata = {
        stateid: $scope.curState._id,
        tasktype: tasktype,
        bundle: bundle,
        asncnt: asncnt,
        antcnt: antcnt,
        creator: $rootScope.currentUser._id,
        created: (new Date).getTime(),
        public: true,
        islist: true,
        list: null
      };
      
      var availlist:number[][] = [];
      var statelen:number = $scope.curState.block_states.length;
      //generate action jobs from states
      var doneAvailList = _.after(statelen, function(){
        var bundleidlist:string[] = [];
        var bundcnt:number = Math.ceil(availlist.length/jobdata.bundle);
        var doneBundles = _.after(bundcnt, function(){
          jobdata.list = bundleidlist;
          genjobsmgr.save(jobdata).then(function(val){
              updateJobMgr();
              toaster.pop('info', 'Jobs Created', val[0]._id);
            }
            , function(err){
              toaster.pop('error', 'Job Create Error', err.reason);
            })
        });

        function saveBundle(){
          var mybundledata = {
            stateid: $scope.curState._id,
            islist: false,
            tasktype: jobdata.tasktype,
            asncnt: jobdata.asncnt,
            antcnt: jobdata.antcnt,
            creator: $rootScope.currentUser._id,
            created: (new Date).getTime(),
            idxlist: abundle
          };
          genjobsmgr.save(mybundledata).then(function(val){
              bundleidlist.push(val[0]._id);
              doneBundles();
              toaster.pop('info', 'Bundle Created', val[0]._id);
            }
            , function(err){
              toaster.pop('error', 'Bundle Data', err.reason);
            }
          );
          abundle = [];
        }
        var abundle:number[][] = [];
        for(var i:number = 0; i < availlist.length; i++){
          if(!(i % jobdata.bundle) && i) saveBundle();
          abundle.push(availlist[i]);
        }
        if(abundle.length) saveBundle(); //save the dangling bundles
      });

      //decide on normal or reverse action
      if(tasktype == 'action' && movedir == 'reverse'){
        for(var i:number = statelen-1; i > -1; i--){
          if(i > 0) availlist.push([i, i-1]); //because we use i & i+1 states in actions
          doneAvailList();
        }
      }
      else{
        for(var i:number = 0; i < statelen; i++){
          if(tasktype == 'action'){
            if(i < statelen-1) availlist.push([i, i+1]); //because we use i & i+1 states in actions
          }
          else availlist.push([i]);
          doneAvailList();
        }
      }
    }
  };
  
  var updateJobMgr = function(){
    $scope.jobmgrlist = GenJobsMgr.find({islist: true}, {sort: {"_id": 1}}).fetch();
  };
  
  $scope.selectJob = function(jid:string){
    var job:iGenJobsMgr = GenJobsMgr.findOne({_id: jid});
    $scope.jobid = jid;
    $scope.jobinfo = [];
    job.list.forEach(function(tid){
      var task:iGenJobsMgr = GenJobsMgr.findOne({_id: tid});
      $scope.jobinfo.push(task);
    });
  };
  
  $scope.remJob = function(jid:string){
    $scope.jobid = null;
    $scope.jobinfo = null; //null out job in case its the one deleted
    var deljob:iGenJobsMgr = GenJobsMgr.findOne({_id: jid});
    deljob.list.forEach(function(j){
      var deltask:iGenJobsMgr = GenJobsMgr.findOne({_id: j});
      if(deltask && deltask.hitlist)
        deltask.hitlist.forEach(function(h){
          GenJobsMgr.remove(h);
        });
      GenJobsMgr.remove(j);
    });
    GenJobsMgr.remove(jid);
    updateJobMgr();
    updateHITs();
  };
  
  $scope.createHIT = function(jid:string, tid:string){
    Meteor.call('mturkCreateHIT', {jid: jid, tid: tid, islive: $scope.options.isLive}, function(err, ret){
      if(err) return $scope.$apply(function(){toaster.pop('error', err)});
      if(ret.error) return $scope.$apply(function(){toaster.pop('error', ret.error)});
      //create the HITId system
      var res = ret.result;
      var hitdata = {
        '_id': 'H_'+res.hit[0].HITId,
        HITId: res.hit[0].HITId,
        HITTypeId: res.hit[0].HITTypeId,
        hitcontent: res.hitcontent,
        tid: tid,
        jid: jid,
        islive: $scope.options.isLive,
        created: (new Date()).getTime()
      };
      $scope.$apply(function(){toaster.pop('info', 'HIT created: '+ hitdata._id)});
      //cannot use save with custom _id
      GenJobsMgr.insert(hitdata, function(err, hid){
        if(err) return $scope.$apply(function(){toaster.pop('error', err)});
        GenJobsMgr.update({_id: tid}, {$addToSet: {hitlist: hid}});
        $scope.selectJob($scope.jobid);
        updateHITs();
      });
    });
  };

  $scope.stateGo = apputils.stateGo($state);

  $scope.options = {}; //angular has issues with updating primitives
  $scope.options.isLive = false;
}]);
