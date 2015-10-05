/*!
 * 
 * Angle - Bootstrap Admin App + AngularJS
 * 
 * Author: @themicon_co
 * Website: http://themicon.co
 * License: http://support.wrapbootstrap.com/knowledge_base/topics/usage-licenses
 * 
 */

if (typeof $ === 'undefined') { throw new Error('This application\'s JavaScript requires jQuery'); }

// APP START
// ----------------------------------- 

angular.module('angle', [
    'angular-meteor',
    'ngRoute',
    'ngAnimate',
    'ngStorage',
    'ngCookies',
    'pascalprecht.translate',
    'ui.bootstrap',
    'ui.router',
    'oc.lazyLoad',
    'cfp.loadingBar',
    'ngSanitize',
    'ngResource',
    'ui.utils'
  ]);

if (Meteor.isCordova)
  angular.element(document).on("deviceready", onReady);
else
  angular.element(document).ready(onReady);


// Application Run
angular.module('angle')
  .run(["$rootScope", "$state", "$stateParams",  '$window', '$templateCache', 
    function ($rootScope, $state, $stateParams, $window, $templateCache) {
      // Set reference to access them from any scope
      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.$storage = $window.localStorage;
      
      // Uncomment this to disable template cache
      /*$rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
          if (typeof(toState) !== 'undefined'){
            $templateCache.remove(toState.templateUrl);
          }
      });*/

      // Scope Globals
      // -----------------------------------
      $rootScope.app = {
        name: 'Block World',
        description: 'Block World Game',
        year: ((new Date()).getFullYear()),
        layout: {
          isFixed: true,
          isCollapsed: true,
          isBoxed: false,
          isRTL: false,
          horizontal: false,
          isFloat: false,
          asideHover: false,
          theme: null
        },
        useFullLayout: false,
        hiddenFooter: false,
        viewAnimation: 'ng-fadeInUp'
      };
      /*$rootScope.user = {
        name:     'William',
        job:      'ng-developer',
        picture:  'app/img/user/02.jpg'
      };*/

      $rootScope.isRole = function(usr, role){
        return (usr.profile.roles.indexOf(role) > -1)
      };
      
      $rootScope.$on("$stateChangeError", function(event, toState, toParams, fromState, fromParams, error) {
        // We can catch the error thrown when the $requireUser promise is rejected
        // and redirect the user back to the main page
        if (error === "AUTH_REQUIRED") {
          $state.go('main');
        }
        else if(error === "FORBIDDEN"){
          $state.go('app.root');
        }
        else console.warn(error);
      });

      $rootScope.mdbArray = function(mcol, q, opt, idx){
        return _.uniq(mcol.find(q, opt).fetch().map(function(x) {
          return x[idx];
        }), true);
      };
      
      $rootScope.Uint8ToString = function(u8a){
        var CHUNK_SZ = 0x8000;
        var c = [];
        for (var i=0; i < u8a.length; i+=CHUNK_SZ) {
          c.push(String.fromCharCode.apply(null, u8a.subarray(i, i+CHUNK_SZ)));
        }
        return c.join("");
      };

      $rootScope.StringToUint8 = function(b64){
        return new Uint8Array(atob(b64).split("").map(function(c) {
          return c.charCodeAt(0); }));
      };


      //setup account callbacks
      accountsUIBootstrap3.logoutCallback = function(err){
        console.warn('logout');
        if(err) console.log("Error:" + err);
        $state.go('main');
      };
      Accounts.config({forbidClientAccountCreation : true});
}]);
