/**========================================================
 * Module: mturktest.js
 * Created by wjwong on 9/24/15.
 =========================================================*/

var mturk = require('mturk-api');

var config = {
 access : 'AKIAIU67PYL5OCMK627A',
 secret : '0X7CPsEm4WYkQrSivWaCJ2PUONGaZHdpYaHLqvC4',
 sandbox: true
}

mturk.connect(config).then(function(api){

 //Example operation, no params
 api.req('GetAccountBalance').then(function(response){
  //Do something
  console.warn(response);
 });

 //Example operation, with params
 api.req('SearchHITs', { PageSize: 100 }).then(function(response){
  //Do something
  console.warn(response);
 });

}).catch(console.error)