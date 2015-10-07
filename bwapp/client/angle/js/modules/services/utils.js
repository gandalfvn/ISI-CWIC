/**=========================================================
 * Module: utils.js
 * Utility library to use across the theme
 =========================================================*/

angular.module('angle').service('Utils', ["$window", "APP_MEDIAQUERY", function($window, APP_MEDIAQUERY) {
    'use strict';
    
    var $html = angular.element("html"),
        $win  = angular.element($window),
        $body = angular.element('body');

    return {
      // DETECTION
      support: {
        transition: (function(){
          var transitionEnd = (function(){

            var element = document.body || document.documentElement,
              transEndEventNames = {
                WebkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd otransitionend',
                transition: 'transitionend'
              }, name;

            for(name in transEndEventNames){
              if(element.style[name] !== undefined) return transEndEventNames[name];
            }
          }());

          return transitionEnd && {end: transitionEnd};
        })(),
        animation: (function(){

          var animationEnd = (function(){

            var element = document.body || document.documentElement,
              animEndEventNames = {
                WebkitAnimation: 'webkitAnimationEnd',
                MozAnimation: 'animationend',
                OAnimation: 'oAnimationEnd oanimationend',
                animation: 'animationend'
              }, name;

            for(name in animEndEventNames){
              if(element.style[name] !== undefined) return animEndEventNames[name];
            }
          }());

          return animationEnd && {end: animationEnd};
        })(),
        requestAnimationFrame: window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(callback){
          window.setTimeout(callback, 1000 / 60);
        },
        touch: (
          ('ontouchstart' in window && navigator.userAgent.toLowerCase().match(/mobile|tablet/)) ||
          (window.DocumentTouch && document instanceof window.DocumentTouch) ||
          (window.navigator['msPointerEnabled'] && window.navigator['msMaxTouchPoints'] > 0) || //IE 10
          (window.navigator['pointerEnabled'] && window.navigator['maxTouchPoints'] > 0) || //IE >=11
          false
        ),
        mutationobserver: (window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || null)
      },
      // UTILITIES
      isInView: function(element, options){

        var $element = $(element);

        if(!$element.is(':visible')){
          return false;
        }

        var window_left = $win.scrollLeft(),
          window_top = $win.scrollTop(),
          offset = $element.offset(),
          left = offset.left,
          top = offset.top;

        options = $.extend({topoffset: 0, leftoffset: 0}, options);

        if(top + $element.height() >= window_top && top - options.topoffset <= window_top + $win.height() &&
          left + $element.width() >= window_left && left - options.leftoffset <= window_left + $win.width()){
          return true;
        } else{
          return false;
        }
      },
      langdirection: $html.attr("dir") == "rtl" ? "right" : "left",
      isTouch: function(){
        return $html.hasClass('touch');
      },
      isSidebarCollapsed: function(){
        return $body.hasClass('aside-collapsed');
      },
      isSidebarToggled: function(){
        return $body.hasClass('aside-toggled');
      },
      isMobile: function(){
        return $win.width() < APP_MEDIAQUERY.tablet;
      },
      /**
       * Helper for Mongo db to get an element item into an arry
       * @param mcol - mongo collection
       * @param q - query
       * @param opt - options
       * @param ele - the element
       * @returns {*}
       */
      mdbArray: function(mcol, q, opt, ele){
        return _.uniq(mcol.find(q, opt).fetch().map(function(x){
          return x[ele];
        }), true);
      },
      /**
       * Convert unsigned int data into text for transport to mongo
       * @param u8a
       * @returns {string}
       * @constructor
       */
      Uint8ToString: function(u8a){
        var CHUNK_SZ = 0x8000;
        var c = [];
        for(var i = 0; i < u8a.length; i += CHUNK_SZ){
          c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
        }
        return c.join("");
      },
      /**
       * string to binary
       * @param b64
       * @returns {Uint8Array}
       * @constructor
       */
      StringToUint8: function(b64){
        return new Uint8Array(atob(b64).split("").map(function(c){
          return c.charCodeAt(0);
        }));
      }
    };
}]);