/**========================================================
 * Module: mturkhelper.js
 * Created by wjwong on 10/27/15.
 =========================================================*/

Meteor.methods({
  mturkCreateHIT: function(p){
    console.warn(p);
    var mturk = Meteor.npmRequire('mturk-api');
    var antpriceact = [0.6, 1.1, 1.5];
    var anttimeact = [1.3, 2, 2.5];
    
    var turk = Async.runSync(function(done){
      var taskdata = GenJobsMgr.findOne({_id: p.tid});
      var len = taskdata.idxlist.length;

      var mturkconf = _.extend({}, serverconfig.mturk);
      mturkconf.sandbox = !p.islive;
      mturk.connect(mturkconf).then(function(api){
        var quest = '<?xml version="1.0" encoding="UTF-8"?>\n<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd"> <ExternalURL>https://cwc-isi.org/annotate?taskId='+ p.tid+'</ExternalURL> <FrameHeight>600</FrameHeight> </ExternalQuestion>';

        var hitcontent = {
          Title: 'Describe this Image ' + p.jid,
          Description: 'Tagging image with a description.',
          Question: quest,
          Reward: {
            Amount: len * 2 * 0.1, 
            CurrencyCode: 'USD'
          },
          AssignmentDurationInSeconds: len * 3 * 60,
          LifetimeInSeconds: 4 * 24 * 60 * 60,
          Keywords: 'image, identification, recognition, tagging, description',
          MaxAssignments: taskdata.asncnt
        };
        if(taskdata.tasktype === 'action'){
          hitcontent.Title = 'Describe this Image Sequence ' + p.jid;
          hitcontent.Description = 'Tagging image transitions with a description.';
          hitcontent.Reward.Amount = len * antpriceact[taskdata.antcnt-1] * 0.1; //price based on more for 1st answer
          hitcontent.AssignmentDurationInSeconds = len * anttimeact[taskdata.antcnt-1] * 60;
        }
        
        api.req('CreateHIT', hitcontent)
          .then(function(resp){
            done(null, {hit: resp.HIT, hitcontent: hitcontent});
          }, function(err){
            //console.warn('CREATEHITS', err);
            done(err);
          });
        /*//Example operation, no params 
        api.req('GetAccountBalance').then(function(resp){
          //Do something 
          console.warn('gab', resp.GetAccountBalanceResult);
        });
        //Example operation, with params 
        api.req('SearchHITs', { PageSize: 100 }).then(function(resp){
          //Do something 
          console.warn('SearchHITS', resp.SearchHITsResult.HIT);
        });*/
        
      }).catch(console.error);
    });

    return turk;
  },
  
  mturkReviewableHITs: function(p){
    var mturk = Meteor.npmRequire('mturk-api');

    var turk = Async.runSync(function(done){
      mturk.connect(serverconfig.mturk).then(function(api){
        api.req('GetAssignmentsForHIT', {HITId: p.hid})
          .then(function(resp){
            console.warn('GetReviewableHITs', resp);
            done(null, resp);
          }, function(err){
            console.warn('GetReviewableHITs', err);
            done(err);
          });
      })
    });

    return turk;
  },
  
});