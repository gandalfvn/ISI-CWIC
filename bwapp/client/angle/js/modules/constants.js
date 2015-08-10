/**=========================================================
 * Module: constants.js
 * Define constants to inject across the application
 =========================================================*/
angular.module('angle')
  .constant('APP_COLORS', {
    'primary':                '#5d9cec',
    'success':                '#27c24c',
    'info':                   '#23b7e5',
    'warning':                '#ff902b',
    'danger':                 '#f05050',
    'inverse':                '#131e26',
    'green':                  '#37bc9b',
    'pink':                   '#f532e5',
    'purple':                 '#7266ba',
    'dark':                   '#3a3f51',
    'yellow':                 '#fad732',
    'gray-darker':            '#232735',
    'gray-dark':              '#3a3f51',
    'gray':                   '#dde6e9',
    'gray-light':             '#e4eaec',
    'gray-lighter':           '#edf1f2'
  })
  .constant('APP_MEDIAQUERY', {
    'desktopLG':             1200,
    'desktop':                992,
    'tablet':                 768,
    'mobile':                 480
  })
  .constant('APP_REQUIRES', {
    // jQuery based and standalone scripts
    scripts: {
      'modernizr':          ['vendor/modernizr/modernizr.js'],
      'icons':              ['vendor/fontawesome/css/font-awesome.min.css',
                             'vendor/simple-line-icons/css/simple-line-icons.css'],
      'glyphiconspro':      [
        'vendor/glyphicons-pro/glyphicons_halflings/web/html_css/css/halflings.css',
        'vendor/glyphicons-pro/glyphicons/web/html_css/css/glyphicons.css',
        'vendor/glyphicons-pro/glyphicons_social/web/html_css/css/social.css',
        'vendor/glyphicons-pro/glyphicons_filetypes/web/html_css/css/filetypes.css'
      ],
      'babylonjs':          [ 'vendor/babylonjs/babylon.2.1.debug.js',
                              //'vendor/babylonjs/preview release - alpha/babylon.2.2.js',
                              'vendor/babylonjs/Oimo.js',
                              'vendor/handjs/hand.js'],
      'circular-json':      ['vendor/circular-json/build/circular-json.js'],
      /*'ngDatatables':           [
        //'vendor/jquery/dist/jquery.min.js',
        'vendor/datatables/media/js/jquery.dataTables.min.js',
        'vendor/angular-datatables/dist/angular-datatables.min.js',
        'vendor/angular-datatables/dist/plugins/bootstrap/angular-datatables.bootstrap.min.js',
        'vendor/angular-datatables/dist/plugins/bootstrap/datatables.bootstrap.min.css',
      ],*/
    },
    // Angular based script (use the right module name)
    modules: [
      {name: 'toaster',                   files: [
        'vendor/angularjs-toaster/toaster.js',
        'vendor/angularjs-toaster/toaster.css'
      ]},
      {name: 'ngDialog', files: [
        'vendor/ngDialog/css/ngDialog.min.css',
        'vendor/ngDialog/css/ngDialog-theme-default.min.css',
        'vendor/ngDialog/js/ngDialog.min.js'
      ]},
      {name: 'datatables', files: [
        'vendor/datatables/media/css/jquery.dataTables.css',
        'vendor/datatables/media/js/jquery.dataTables.js',
        'vendor/angular-datatables/dist/angular-datatables.min.js'], serie: true},
    ]
  })
;