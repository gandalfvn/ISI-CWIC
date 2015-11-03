/**========================================================
 * Module: gen-jobs-view.js
 * Created by wjwong on 9/23/15.
 =========================================================*/
angular.module('angle').controller('genJobsCtrl', ['$rootScope', '$scope', '$state', '$translate', '$window', '$localStorage', '$timeout', '$meteor', 'ngDialog', 'toaster', 'Utils', function($rootScope, $scope, $state, $translate, $window, $localStorage, $timeout, $meteor, ngDialog, toaster, utils){
  "use strict";

  var canvas = {width: 384, height: 264};
  $scope.dtOptionsAvail = {
    "lengthMenu": [[5], [5]],
    "order": [[1, "asc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  $scope.dtOptionsGrp = {
    "lengthMenu": [[10], [10]],
    "order": [[1, "asc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  $scope.dtOptionsTask = {
    "lengthMenu": [[10], [10]],
    "order": [[0, "asc"]],
    "language": {"paginate": {"next": '>', "previous": '<'}},
    "dom": '<"pull-left"f><"pull-right"i>rt<"pull-left"p>'
  };

  var genstates = $scope.$meteorCollection(GenStates);
  $scope.$meteorSubscribe("genstates").then(
    function(sid){dataReady('genstates');},
    function(err){ console.log("error", arguments, err); }
  );

  var screencaps = $scope.$meteorCollection(ScreenCaps);
  $scope.$meteorSubscribe("screencaps").then(
    function(sid){dataReady('screencaps');},
    function(err){ console.log("error", arguments, err); }
  );

  var genjobsmgr = $scope.$meteorCollection(GenJobsMgr);
  $scope.$meteorSubscribe("genjobsmgr").then(
    function(sid){dataReady('genjobsmgr');},
    function(err){ console.log("error", arguments, err); }
  );
  
  $scope.dataready = false;
  var readydat = [];
  var dataReady = function(data){
    console.warn('data ready ', data, (new Date).getTime());
    readydat.push(data);
    if(readydat.length > 2){
      $rootScope.dataloaded = true;
      $scope.doneHITs = getDoneHITs();
      updateTableStateParams();
      updateJobMgr();
    }
  };

  var getDoneHITs= function(){
    var donejobs = GenJobsMgr.find(
      {$and: [{HITId: {$exists: true}}, {submitted: {$exists: true}}]}
      , {fields: {tid: 1, 'submitted.name': 1, 'submitted.time': 1}}
      , {sort: {'submitted.time': -1}}
    ).fetch();
    var sorteddone = [];
    _.each(donejobs, function(j){
      j.submitted.forEach(function(h){
        sorteddone.push({time: h.time, name: h.name, tid: j.tid, hid: j._id.split('_')[1]})
      })
    });
    return sorteddone.sort(function(a,b){a.time > b.time});
  };
  
  var updateTableStateParams = function(){
    $scope.stateslist = GenStates.find({}, {sort: {"_id": 1}}).fetch();
  };

  function CurrentState(c){
    var l = ['block_meta', 'block_states', '_id','public','created','creator','name'];
    this.clear =  function(){
      for(var i = 0; i < l.length; i++){
        this[l[i]] = null;
      }
      if(!_.isUndefined(this._id)) delete this._id;
    };
    this.copy = function(s){
      for(var i = 0; i < l.length; i++){
        this[l[i]] = s[l[i]];
      }
    };
    this.clear();
    if(c) this.copy(c);
  }
  $scope.curState = new CurrentState();

  $scope.remState = function(sid){
    if(sid){
      genstates.remove(sid);
      updateTableStateParams();
      toaster.pop('warning', 'Removed ' + sid);
    }
  };

  $scope.chooseState = function(sid){
    $scope.enableImpSave = false;
    //we must get the state for this sid
    $scope.$meteorSubscribe("genstates", sid).then(
      function(sub){
        var myframe = GenStates.findOne({_id: sid});
        if(!myframe) return $scope.$apply(function(){toaster.pop('warn', 'Invalid State ID')});
        $scope.curState.clear();
        $scope.curState.copy(myframe);
        $scope.showMove(0);
      }
    )
  };

  $scope.showMove = function(i){
    $('#imgpreview').empty();
    var scid = $scope.curState.block_states[i].screencapid;
    $scope.$meteorSubscribe('screencaps', scid).then(
      function(sub){
        var retid = navImgButtons('imgpreview', i);
        var screen = ScreenCaps.findOne({_id: scid});
        showImage(screen.data, 'Move #: '+i, retid);
      }
    );
  };

  var navImgButtons = function(id, i){
    var lenID = $('div').length;
    var eleDivID = 'rowdiv' + lenID; // Unique ID
    var retId = id+lenID;
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

  var showImage = function(b64i, text, attachID){
    if(!attachID) return console.warn('showImage missing attachID');
    var b64img = LZString.decompressFromUTF16(b64i);

    var eleDivID = 'div' + $('div').length; // Unique ID
    var eleImgID = 'img' + $('img').length; // Unique ID
    var eleLabelID = 'h4' + $('h4').length; // Unique ID
    var htmlout = '';
    if(text) htmlout += '<b>'+text+'</b><br>';
    htmlout += '<img id="'+eleImgID+'" style="width:'+canvas.width*2/3+'px;height:'+canvas.height*2/3+'px"></img>';
    // + '<label id="'+eleLabelID+'" class="mb"> '+id+'</label>';
    $('<div>').attr({
      id: eleDivID
    }).addClass('col-sm-4')
      .html(htmlout).css({}).appendTo('#'+attachID);

    var img = document.getElementById(eleImgID); // Use the created element
    img.src = b64img;
  };

  $scope.taskGen = function(tasktype, movedir, bundle, asncnt, antcnt){
    console.warn(tasktype, movedir, bundle, asncnt, antcnt);
    var statelist = utils.mdbArray(GenStates, {}, {
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
        islist: true
      };
      
      var availlist = [];
      var statelen = $scope.curState.block_states.length;
      //generate action jobs from states
      var doneAvailList = _.after(statelen, function(){
        var bundleidlist = [];
        var bundcnt = Math.ceil(availlist.length/jobdata.bundle);
        var doneBundles = _.after(bundcnt, function(){
          jobdata.list = bundleidlist;
          genjobsmgr.save(jobdata).then(function(val){
              var jmid = val[0]._id;
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
            creator: $rootScope.currentUser._id,
            created: (new Date).getTime(),
            asncnt: jobdata.asncnt,
            antcnt: jobdata.antcnt,
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
        var abundle = [];
        for(var i = 0; i < availlist.length; i++){
          if(!(i % jobdata.bundle) && i) saveBundle();
          abundle.push(availlist[i]);
        }
        if(abundle.length) saveBundle(); //save the dangling bundles
      });

      //decide on normal or reverse action
      if(tasktype == 'action' && movedir == 'reverse'){
        for(var i = statelen-1; i > -1; i--){
          if(i > 0) availlist.push([i, i-1]); //because we use i & i+1 states in actions
          doneAvailList();
        }
      }
      else{
        for(var i = 0; i < statelen; i++){
          if(tasktype == 'action'){
            if(i < statelen-1) availlist.push([i, i+1]); //because we use i & i+1 states in actions
          }
          else availlist.push(i);
          doneAvailList();
        }
      }
    }
  };
  
  var updateJobMgr = function(){
    $scope.jobmgrlist = GenJobsMgr.find({islist: true}, {sort: {"_id": 1}}).fetch();
  };
  
  $scope.selectJob = function(jid){
    var job = GenJobsMgr.findOne({_id: jid});
    $scope.jobid = jid;
    $scope.jobinfo = [];
    job.list.forEach(function(tid){
      var task = GenJobsMgr.findOne({_id: tid});
      $scope.jobinfo.push(task);
    });
    console.warn($scope.jobinfo);
  };
  
  $scope.remJob = function(jid){
    console.warn('remJob', jid);
    $scope.jobid = null;
    $scope.jobinfo = null; //null out job in case its the one deleted
    var deljob = GenJobsMgr.findOne({_id: jid});
    deljob.list.forEach(function(j){
      var deltask = GenJobsMgr.findOne({_id: j});
      if(deltask && deltask.hitlist)
        deltask.hitlist.forEach(function(h){
          console.warn('remove h ', h);
          GenJobsMgr.remove(h);
        });
      console.warn('remove j ', j);
      GenJobsMgr.remove(j);
    });
    console.warn('remove jid ', jid);
    GenJobsMgr.remove(jid);
    updateJobMgr();
  };
  
  $scope.createHIT = function(tid){
    Meteor.call('mturkCreateHIT', {tid: tid}, function(err, ret){
      if(err) return $scope.$apply(function(){toaster.pop('error', err)});
      if(ret.error) return $scope.$apply(function(){toaster.pop('error', ret.error)});
      //create the HITId system
      var res = ret.result[0];
      var hitdata = {
        '_id': 'H_'+res.HITId,
        HITId: res.HITId,
        HITTypeId: res.HITTypeId,
        tid: tid,
        created: (new Date()).getTime()
      };
      $scope.$apply(function(){toaster.pop('info', 'HIT created: '+ hitdata._id)});
      //cannot use save with custom _id
      GenJobsMgr.insert(hitdata, function(err, hid){
        if(err) return $scope.$apply(function(){toaster.pop('error', err)});
        GenJobsMgr.update({_id: tid}, {$addToSet: {hitlist: hid}});
        $scope.selectJob($scope.jobid);
      });
    });
  };
  
}]);
