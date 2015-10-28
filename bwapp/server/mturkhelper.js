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
      mturk.connect(mturkconf).then(function(api){
        
        var quest = '<?xml version="1.0" encoding="UTF-8"?>\n<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd"> <ExternalURL>https://45.55.184.244/annotate?taskId=Twc6bmr3ufmY3Y2vL</ExternalURL> <FrameHeight>600</FrameHeight> </ExternalQuestion>';

        api.req('CreateHIT', {Title: 'Assignment ' + p.tid, Description: 'Job ' + p.tid, Question: quest, Reward: {Amount: 15*0.1, CurrencyCode: 'USD'}, AssignmentDurationInSeconds: 20*60, LifetimeInSeconds: 24*60*60, Keywords: 'image, identification, recognition, tagging, description', MaxAssignments: 3})
          .then(function(response){
            console.warn('CreateHITS', response.HIT);
            done(null, response.HIT);
          }, function(err){
            console.warn('CREATEHITS', err);
            done(err);
          });
        /*//Example operation, no params 
        api.req('GetAccountBalance').then(function(response){
          //Do something 
          console.warn('gab', response.GetAccountBalanceResult);
        });
        //Example operation, with params 
        api.req('SearchHITs', { PageSize: 100 }).then(function(response){
          //Do something 
          console.warn('SearchHITS', response.SearchHITsResult.HIT);
        });*/
        
      }).catch(console.error);
    });

    console.warn('return', turk);
    return turk;
  }
});