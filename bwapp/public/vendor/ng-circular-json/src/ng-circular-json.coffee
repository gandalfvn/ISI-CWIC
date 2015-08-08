do ->
  'use strict'
  angular.module 'ngCircularJSON', []

  angular.module('ngCircularJSON').factory 'CircularJSON', ($window) ->
    if $window.CircularJSON
      $window._thirdParty = $window._thirdParty or {}
      $window._thirdParty.CircularJSON = $window.CircularJSON

      try
        delete $window.CircularJSON
      catch e
        $window.CircularJSON = undefined

    CircularJSON = $window._thirdParty.CircularJSON
    CircularJSON