(function() {
  'use strict';
  angular.module('ngCircularJSON', []);
  return angular.module('ngCircularJSON').factory('CircularJSON', function($window) {
    var CircularJSON, e;
    if ($window.CircularJSON) {
      $window._thirdParty = $window._thirdParty || {};
      $window._thirdParty.CircularJSON = $window.CircularJSON;
      try {
        delete $window.CircularJSON;
      } catch (_error) {
        e = _error;
        $window.CircularJSON = void 0;
      }
    }
    CircularJSON = $window._thirdParty.CircularJSON;
    return CircularJSON;
  });
})();
