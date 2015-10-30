/**========================================================
 * Module: mturkhelper.js
 * Created by wjwong on 10/27/15.
 =========================================================*/

var mturkconf = {
  access: 'AKIAIU67PYL5OCMK627A',
  secret: '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',
  sandbox: true
}

Meteor.methods({
  mturkCreateHIT: function(p){
    console.warn(p);
    var mturk = Meteor.npmRequire('mturk-api');
    
    var turk = Async.runSync(function(done){
      var taskdata = GenJobsMgr.findOne({_id: p.tid});
      var len = taskdata.idxlist.length;
      
      mturk.connect(mturkconf).then(function(api){
        var quest = '<?xml version="1.0" encoding="UTF-8"?>\n<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd"> <ExternalURL>https://45.55.184.244/annotate?taskId='+ p.tid+'</ExternalURL> <FrameHeight>600</FrameHeight> </ExternalQuestion>';

        var hitcontent = {
          Title: 'Describe this Image ' + p.tid,
          Description: 'Tagging image with a description.',
          Question: quest,
          Reward: {
            Amount: len * 2 * 0.1, 
            CurrencyCode: 'USD'
          },
          AssignmentDurationInSeconds: len * 3 * 60,
          LifetimeInSeconds: 24 * 60 * 60,
          Keywords: 'image, identification, recognition, tagging, description',
          MaxAssignments: 3
        };
        if(taskdata.tasktype === 'action'){
          hitcontent.Title = 'Describe this Image Sequence ' + p.tid;
          hitcontent.Description = 'Tagging image transitions witn a description.';
          hitcontent.Reward.Amount = len * 1.5 * 0.1;
          hitcontent.AssignmentDurationInSeconds = len * 2 * 60;
        }
        
        api.req('CreateHIT', hitcontent)
          .then(function(resp){
            //console.warn('CreateHITS', resp.HIT);
            done(null, resp.HIT);
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
      mturk.connect(mturkconf).then(function(api){
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