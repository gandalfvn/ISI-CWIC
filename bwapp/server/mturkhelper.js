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
        //Example operation, no params 
        api.req('GetAccountBalance').then(function(response){
          //Do something 
          console.warn('gab', response.GetAccountBalanceResult);
        });
        
        var quest = '<?xml version="1.0" encoding="UTF-8"?>\n<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd"> <ExternalURL>https://45.55.184.244/annotate?taskId=Twc6bmr3ufmY3Y2vL</ExternalURL> <FrameHeight>400</FrameHeight> </ExternalQuestion>';

        /*        api.req('CreateHIT', {Title: 'Assignment ' + p.jid, Description: 'Job ' + p.jid, Question: {ExternalQuestion: {ExternalURL: 'https://45.55.184.244/annotate?taskId=Twc6bmr3ufmY3Y2vL', FrameHeight: 400}}, Reward: {Amount: 5, CurrencyCode: 'USD'}, AssignmentDurationInSeconds: 15*60, LifetimeInSeconds: 24*60*60, Keywords: 'identification, tagging, image', MaxAssignments: 3})
         */
        api.req('CreateHIT', {Title: 'Assignment ' + p.jid, Description: 'Job ' + p.jid, Question: quest, Reward: {Amount: 15*0.1, CurrencyCode: 'USD'}, AssignmentDurationInSeconds: 20*60, LifetimeInSeconds: 24*60*60, Keywords: 'image, identification, recognition, tagging, description', MaxAssignments: 3})
          .then(function(response){
          //Do something 
          console.warn('CreateHITS', response);
        }, function(err){console.warn('CREATEHITS', err)});

        //Example operation, with params 
        api.req('SearchHITs', { PageSize: 100 }).then(function(response){
          //Do something 
          console.warn('SearchHITS', response.SearchHITsResult.HIT);
        });
        
        done(null, 'good');

      }).catch(console.error);
    });

    console.warn(turk.result);
    return turk.result;
  }
});