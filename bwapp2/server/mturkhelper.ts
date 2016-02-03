/**========================================================
 * Module: mturkhelper.ts
 * Created by wjwong on 10/27/15.
 =========================================================*/
/// <reference path="./config.d.ts" />
/// <reference path="../model/genjobsmgrdb.ts" />
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/meteor/meteor.d.ts" />

declare var Async:any;

interface iHITContent{
  Title: string,
  Description: string,
  Question: string,
  Reward: {
    Amount: number,
    CurrencyCode: string
  },
  AssignmentDurationInSeconds: number,
  LifetimeInSeconds: number,
  Keywords: string,
  MaxAssignments: number,
  QualificationRequirement?: {
    QualificationTypeId: string,
    Comparator: string,
    IntegerValue?: string,
    LocaleValue?: {
      Country: string
    }[]
  }[]
}

interface iTurkCreateParam{
  jid: string, tid: string, islive: boolean, useQual: boolean
}

interface iBlockTurker{
  WorkerId: string,
  Reason: string
}

interface iReviewableHITs{
  Status: string,
  PageSize: number,
  PageNumber: number
}

Meteor.methods({
  mturkCreateHIT: function(p:iTurkCreateParam){
    console.warn(p);
    var mturk = Meteor['npmRequire']('mturk-api');
    var antpriceact:number[] = [0.5, 1.0, 1.5];
    var anttimeact:number[] = [5, 5.5, 6];
    var partfullpriceact:number[] = [1.0, 2.0, 3.0];
    var partfulltimeact:number[] = [6, 7, 8];
    
    var turk = Async.runSync(function(done){
      var taskdata:miGenJobsMgr.iGenJobsMgr = GenJobsMgr.findOne({_id: p.tid});
      var len:number = taskdata.idxlist.length;

      var mturkconf:iMTurk = <iMTurk>_.extend({}, serverconfig.mturk);
      mturkconf.sandbox = !p.islive;
      mturk.connect(mturkconf).then(function(api){
        var quest:string = '<?xml version="1.0" encoding="UTF-8"?>\n<ExternalQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2006-07-14/ExternalQuestion.xsd"> <ExternalURL>https://cwc-isi.org/annotate?taskId='+ p.tid+'</ExternalURL> <FrameHeight>800</FrameHeight> </ExternalQuestion>';

        var hitcontent:iHITContent = {
          Title: 'Describe this Image ' + p.jid,
          Description: 'Tagging image with a description.',
          Question: quest,
          Reward: {
            Amount: len * 2 * 0.1, 
            CurrencyCode: 'USD'
          },
          AssignmentDurationInSeconds: len * 3 * 60,
          LifetimeInSeconds: 10 * 24 * 60 * 60,
          Keywords: 'image, identification, recognition, tagging, description',
          MaxAssignments: taskdata.asncnt,
        };
        if(p.useQual){
          hitcontent.QualificationRequirement = [
            {
              QualificationTypeId: "000000000000000000L0",
              Comparator: "GreaterThanOrEqualTo",
              IntegerValue: "95"
            },
            {
              QualificationTypeId: "00000000000000000040",
              Comparator: "GreaterThanOrEqualTo",
              IntegerValue: "1000"
            },
            {
              QualificationTypeId: "00000000000000000071",
              Comparator: "In",
              LocaleValue: [
                {
                  Country: "US"
                },
                {
                  Country: "CA"
                }
              ]
            }
          ];
        }
        if(taskdata.tasktype === 'action'){
          hitcontent.Title = 'Describe this Image Sequence ' + p.jid;
          hitcontent.Description = 'Tagging image transitions with a description.';
          if(taskdata.statetype === 'partial' || taskdata.statetype === 'full'){
            hitcontent.Reward.Amount = len * partfullpriceact[taskdata.antcnt-1] * 0.1; //price based on more for 1st answer
            hitcontent.AssignmentDurationInSeconds = len * partfulltimeact[taskdata.antcnt-1] * 60;
          } else {
            hitcontent.Reward.Amount = len * antpriceact[taskdata.antcnt - 1] * 0.1; //price based on more for 1st answer
            hitcontent.AssignmentDurationInSeconds = len * anttimeact[taskdata.antcnt - 1] * 60;
          }
        }
        
        api.req('CreateHIT', hitcontent)
          .then(function(resp){
            done(null, {hit: resp.HIT, hitcontent: hitcontent});
          }, function(err){
            console.warn('CREATEHITS ERR', err);
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
  
  mturkBlockTurker: function(p:iBlockTurker){
    var mturk = Meteor['npmRequire']('mturk-api');

    var turk = Async.runSync(function(done){
      var mturkconf:iMTurk = <iMTurk>_.extend({}, serverconfig.mturk);
      mturkconf.sandbox = false; //always operate in live env.
      mturk.connect(mturkconf).then(function(api){
        api.req('BlockWorker', p)
          .then(function(resp){
            done(null, resp);
          }, function(err){
            console.warn('BlockWorker err', err);
            done(err);
          });
      })
    });

    return turk;
  },

  mturkReviewHITs: function(p:iReviewableHITs){
    var mturk = Meteor['npmRequire']('mturk-api');

    var turk = Async.runSync(function(done){
      var mturkconf:iMTurk = <iMTurk>_.extend({}, serverconfig.mturk);
      mturkconf.sandbox = false; //always operate in live env.
      mturk.connect(mturkconf).then(function(api){
        api.req('GetReviewableHITs', p)
          .then(function(resp){
            done(null, resp);
          }, function(err){
            console.warn('GetReviewableHITs err', err);
            done(err);
          });
      })
    });

    return turk;
  }

});