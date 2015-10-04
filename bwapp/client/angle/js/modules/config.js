/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/

angular.module('angle').config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 'RouteHelpersProvider',
function ($stateProvider, $locationProvider, $urlRouterProvider, helper) {
  'use strict';

  // Set the following to true to enable the HTML5 Mode
  // You may have to set <base> tag in index and a routing configuration in your server
  $locationProvider.html5Mode(true);

  // default route
  $urlRouterProvider.otherwise('404');

  // 
  // Application Routes
  // -----------------------------------   
  $stateProvider
    .state('app', {
      url: '',
      abstract: true,
      templateUrl: helper.basepath('app.html'),
      controller: 'AppController',
      resolve: helper.resolveFor('modernizr', 'icons', 'toaster')
    })
    .state('app.root', {
      url: '/',
      title: "Block World",
      onEnter: ['$rootScope','$state', '$meteor', function($rootScope, $state, $meteor){
        $meteor.requireUser().then(function(usr){
          if(usr){
            if($rootScope.isRole(usr, 'agent')) $state.go('app.games');
            else $state.go('app.worldview');
          }
          else $state.go('main');
        }, function(err){
            $state.go('main');
        });
      }]
      /*resolve: {"currentUser": ["$meteor", function($meteor){return $meteor.requireUser();}]},
      controller: ["$rootScope",'$state', function($rootScope, $state){
        if($rootScope.currentUser){
          //check for agent role
          if($rootScope.isRole($rootScope.currentUser, 'agent'))
            $state.go('app.games');
          else $state.go('app.worldview');
        }
        else $state.go('main');
      }]*/
    })
    .state('app.genworld', {
      url: '/genworld',
      title: 'Generate World',
      templateUrl: helper.basepath('genworld.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('babylonjs', 'glyphiconspro','circular-json','ngDialog','datatables', 'ngMd5')
      ),
      controller: 'genWorldCtrl'
    })
    .state('app.gengallery', {
      url: '/gengallery',
      title: 'Generate State Gallery',
      templateUrl: helper.basepath('gengallery.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('babylonjs', 'glyphiconspro','circular-json','ngDialog','datatables', 'ngMd5')
      ),
      controller: 'genGalleryCtrl'
    })
    .state('app.genjobs', {
      url: '/genjobs',
      title: 'Generate Tasks View',
      templateUrl: helper.basepath('genjobs.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('ngDialog','datatables')
      ),
      controller: 'genJobsCtrl'
    })
    .state('app.worldview', {
        url: '/worldview',
        title: 'World View',
        templateUrl: helper.basepath('worldview.html'),
        resolve: angular.extend(
          {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
            return !$rootScope.isRole(user, 'agent');});
            }]},  //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs', 'glyphiconspro','circular-json','ngDialog')
        ),
        controller: 'worldCtrl'
    })
    .state('app.simpworld', {
      url: '/simpworld',
      title: 'World View',
      templateUrl: helper.basepath('worldview.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('babylonjs')
      ),
      controller: 'worldSimpCtrl'
    })
    .state('app.replay', {
      url: '/replay?taskid&gameid',
      title: 'Replay View',
      templateUrl: helper.basepath('replay.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('babylonjs', 'glyphiconspro','circular-json','ngDialog','datatables')
      ),
      controller: 'replayCtrl'
    })
    .state('app.describe', {
      url: '/describe?annotid',
      title: 'Describe View',
      templateUrl: helper.basepath('describe.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('babylonjs', 'glyphiconspro','circular-json','ngDialog','datatables')
      ),
      controller: 'describeCtrl'
    })
    .state('app.tasks', {
      url: '/tasks',
      title: 'Tasks View',
      templateUrl: helper.basepath('tasks.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return !$rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('ngDialog','datatables')
      ),
      controller: 'tasksCtrl'
    })
    .state('app.games', {
      url: '/games',
      title: 'Games List',
      templateUrl: helper.basepath('games.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return $rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('ngDialog','datatables')
      ),
      controller: 'gamesCtrl'
    })
    .state('app.game', {
      url: '/game/:jobid',
      title: 'Game View',
      templateUrl: helper.basepath('gameview.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return $rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('babylonjs', 'glyphiconspro','circular-json','ngDialog')
      ),
      controller: 'gameCtrl'
    })
    .state('goal', {
      url: '/goal/:gameid',
      title: 'Goal View',
      templateUrl: helper.basepath('goalview.html'),
      resolve: angular.extend(
        {"currentUser": ["$meteor", '$rootScope', function($meteor, $rootScope){return $meteor.requireValidUser(function(user){
          return $rootScope.isRole(user, 'agent');});
        }]},  //simple functions appear first so data is loaded
        helper.resolveFor('modernizr', 'icons', 'toaster', 'babylonjs', 'glyphiconspro','circular-json','ngDialog')
      ),
      controller: 'goalCtrl'
    })
    .state('404', {
      url: '/404',
      title: "Not Found",
      templateUrl: helper.basepath('404.html'),
      resolve: helper.resolveFor('modernizr', 'icons'),
      controller: ["$rootScope", function($rootScope) {
        $rootScope.app.layout.isBoxed = false;
      }]
    })
    .state('main', {
      url: '/main',
      title: "Block World",
      templateUrl: helper.basepath('main.html'),
      resolve: helper.resolveFor('modernizr', 'icons'),
      onEnter: ["$rootScope","$state","$meteor", function($rootScope, $state, $meteor) {
        $rootScope.app.layout.isBoxed = false;
        $meteor.requireUser().then(function(usr){
          if(usr) $state.go('app.worldview');
        });
        Accounts.onLogin(function(user){
          $state.go('app.root')
        })
      }]
    })
    //
    // CUSTOM RESOLVES
    //   Add your own resolves properties
    //   following this object extend
    //   method
    // ----------------------------------- 
    // .state('app.someroute', {
    //   url: '/some_url',
    //   templateUrl: 'path_to_template.html',
    //   controller: 'someController',
    //   resolve: angular.extend(
    //     helper.resolveFor(), {
    //     // YOUR RESOLVES GO HERE
    //     }
    //   )
    // })
    ;


}]).config(['$ocLazyLoadProvider', 'APP_REQUIRES', function ($ocLazyLoadProvider, APP_REQUIRES) {
    'use strict';

    // Lazy Load modules configuration
    $ocLazyLoadProvider.config({
      debug: false,
      events: true,
      modules: APP_REQUIRES.modules
    });

}]).config(['$controllerProvider', '$compileProvider', '$filterProvider', '$provide',
    function ( $controllerProvider, $compileProvider, $filterProvider, $provide) {
      'use strict';
      // registering components after bootstrap
      angular.module('angle').controller = $controllerProvider.register;
      angular.module('angle').directive  = $compileProvider.directive;
      angular.module('angle').filter     = $filterProvider.register;
      angular.module('angle').factory    = $provide.factory;
      angular.module('angle').service    = $provide.service;
      angular.module('angle').constant   = $provide.constant;
      angular.module('angle').value      = $provide.value;

}]).config(['$translateProvider', function ($translateProvider) {

    $translateProvider.useStaticFilesLoader({
        prefix : 'translate/',
        suffix : '.json'
    });
    $translateProvider.preferredLanguage('en');
    $translateProvider.useLocalStorage();
    $translateProvider.usePostCompiling(true);

}]).config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeBar = false; //wjw no loading bar
    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.latencyThreshold = 500;
    cfpLoadingBarProvider.parentSelector = '.wrapper > section';
}]).config(['$tooltipProvider', function ($tooltipProvider) {
    $tooltipProvider.options({appendToBody: true});
}])
;
