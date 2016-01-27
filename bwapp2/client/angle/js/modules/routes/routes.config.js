/**=========================================================
 * Module: config.js
 * App routes and resources configuration
 =========================================================*/


(function() {
  'use strict';
  angular
      .module('app.routes')
      .config(routesConfig);

  routesConfig.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider', 'RouteHelpersProvider'];
  function routesConfig($stateProvider, $locationProvider, $urlRouterProvider, helper) {

    // Set the following to true to enable the HTML5 Mode
    // You may have to set <base> tag in index and a routing configuration in your server
    $locationProvider.html5Mode(true);

    // defaults to dashboard
    $urlRouterProvider.otherwise('/404');

    // 
    // Application Routes
    // -----------------------------------   
    $stateProvider
      .state('404', {
        url: '/404',
        title: "Not Found",
        templateUrl: helper.basepath('404.html'),
        resolve: helper.resolveFor('modernizr', 'icons'),
        controller: ["$rootScope", function ($rootScope) {
          $rootScope.app.layout.isBoxed = false;
        }]
      })
      .state('main', {
        url: '/main',
        title: "CwC ISI",
        templateUrl: helper.basepath('main.html'),
        resolve: helper.resolveFor('modernizr', 'icons'),
        onEnter: ["$rootScope", "$state", "$auth", function ($rootScope, $state, $auth) {
          $rootScope.app.layout.isBoxed = false;
          $auth.requireUser().then(function (usr) {
            if(!$rootScope.isRole(usr, 'guest')){
              if (usr) $state.go('app.genworld');
            }

          });
          Accounts.onLogin(function (user) {
            $state.go('app.root')
          })
        }]
      })
      .state('app', {
        url: '',
        abstract: true,
        templateUrl: helper.basepath('app.html'),
        resolve: helper.resolveFor('modernizr', 'icons', 'toaster')
      })
      .state('app.root', {
        url: '/',
        title: "CwC ISI",
        onEnter: ['$rootScope', '$state', '$auth', function ($rootScope, $state, $auth) {
          $auth.requireUser().then(function (usr) {
            if (usr) {
              if($rootScope.isRole(usr, 'guest')){
                $state.go('main')
              }
              else{
                if ($rootScope.isRole(usr, 'agent')) $state.go('app.games');
                else $state.go('app.genworld');
              }
            }
            else $state.go('main');
          }, function (err) {
            $state.go('main');
          });
        }]
      })
      .state('app.genworld', {
        url: '/genworld?sid',
        title: 'Generate World',
        templateUrl: helper.basepath('genworld.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'guest');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs', 'ngDialog', 'ngTable')
        ),
        controller: 'genWorldCtrl'
      })
      .state('app.gensimpexp', {
        url: '/gensimpexp?sid',
        title: 'Simple Experiment',
        templateUrl: helper.basepath('gensimpexp.html'),
        resolve: /*angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'agent');
              });
            }]
          }, */ //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs', 'datatables')
        //)
        ,
        controller: 'genSimpExpCtrl'
      })
      .state('app.gencmdexp', {
        url: '/gencmdexp?sid',
        title: 'Simple Experiment',
        templateUrl: helper.basepath('gencmdexp.html'),
        resolve: helper.resolveFor('babylonjs', 'datatables')
        ,controller: 'genCmdExpCtrl'
      })
      .state('app.genpred', {
        url: '/genpred?sid',
        title: 'Generate Prediction',
        templateUrl: helper.basepath('genpred.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'guest');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs', 'ngTable')
        ),
        controller: 'genPredCtrl'
      })
      .state('app.genjobs', {
        url: '/genjobs',
        title: 'Generate Tasks View',
        templateUrl: helper.basepath('genjobs.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'guest');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('ngDialog', 'datatables')
        ),
        controller: 'genJobsCtrl'
      })
      .state('gentask', {
        url: '/annotate?taskId&assignmentId&hitId&turkSubmitTo&workerId&report',
        title: 'Annotation Task',
        templateUrl: helper.basepath('gentask.html'),
        resolve: helper.resolveFor('modernizr', 'icons', 'toaster', 'ngDialog', 'datatables','ngDeviceDetect'),
        controller: 'genTaskCtrl'
      })
      .state('app.tasks', {
        url: '/tasks',
        title: 'Tasks View',
        templateUrl: helper.basepath('tasks.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'guest');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('ngDialog', 'datatables')
        ),
        controller: 'tasksCtrl'
      })
      /*
      .state('app.worldview', {
        url: '/worldview',
        title: 'World View',
        templateUrl: helper.basepath('worldview.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'agent');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs', 'ngDialog')
        ),
        controller: 'worldCtrl'
      })
      .state('app.simpworld', {
        url: '/simpworld',
        title: 'World View',
        templateUrl: helper.basepath('worldview.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'agent');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs')
        ),
        controller: 'worldSimpCtrl'
      })
      .state('app.replay', {
        url: '/replay?taskid&gameid',
        title: 'Replay View',
        templateUrl: helper.basepath('replay.html'),
        resolve: angular.extend(
          {
            "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
              return $auth.requireValidUser(function (user) {
                return !$rootScope.isRole(user, 'agent');
              });
            }]
          },  //simple functions appear first so data is loaded
          helper.resolveFor('babylonjs', 'ngDialog', 'datatables')
        ),
        controller: 'replayCtrl'
      })
       .state('app.games', {
         url: '/games',
         title: 'Games List',
         templateUrl: helper.basepath('games.html'),
         resolve: angular.extend(
           {
             "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
               return $auth.requireValidUser(function (user) {
                 return $rootScope.isRole(user, 'agent');
               });
             }]
           },  //simple functions appear first so data is loaded
           helper.resolveFor('ngDialog', 'datatables')
         ),
         controller: 'gamesCtrl'
       })
       .state('app.game', {
         url: '/game/:jobid',
         title: 'Game View',
         templateUrl: helper.basepath('gameview.html'),
         resolve: angular.extend(
           {
             "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
               return $auth.requireValidUser(function (user) {
                 return $rootScope.isRole(user, 'agent');
               });
             }]
           },  //simple functions appear first so data is loaded
           helper.resolveFor('babylonjs', 'ngDialog')
         ),
         controller: 'gameCtrl'
       })
       .state('goal', {
         url: '/goal/:gameid',
         title: 'Goal View',
         templateUrl: helper.basepath('goalview.html'),
         resolve: angular.extend(
           {
             "currentUser": ["$auth", '$rootScope', function ($auth, $rootScope) {
               return $auth.requireValidUser(function (user) {
                 return $rootScope.isRole(user, 'agent');
               });
             }]
           },  //simple functions appear first so data is loaded
           helper.resolveFor('modernizr', 'icons', 'toaster', 'babylonjs', 'ngDialog')
         ),
         controller: 'goalCtrl'
       })
      */
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

  } // routesConfig

})();

