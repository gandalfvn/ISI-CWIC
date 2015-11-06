/**========================================================
 * Module: genjobsmgrdb.ts
 * Created by wjwong on 10/3/15.
 =========================================================*/
/// <reference path="../server/typings/meteor/meteor.d.ts" />

interface iGenJobsMgr {
  _id: string,
  stateid: string,
  islist: boolean,
  tasktype: string,
  asncnt: number,
  antcnt: number,
  creator: string,
  created: number,
  idxlist?: number[][],
  list?: string[],
  hitlist?: string[]
}

interface iGenJobsHIT {
  _id: string,
  HITId: string,
  HITTypeId: string,
  tid: string,
  jid: string,
  islive: boolean,
  created: number,
  hitcontent: iHitContent,
  notes: {[x: string]: string[][]},
  timed: {[x: string]: number[]},
  submitted: Array<iSubmitEle>
}

interface iHitContent {
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
  MaxAssignments: number
}

interface iSubmitEle {
  name: string,
  time: string,
  aid: string
}

declare var GenJobsMgr:any;
GenJobsMgr = new Mongo.Collection('genjobsmgr');
