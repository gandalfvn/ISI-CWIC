
Meteor.methods({
  sidebar: function(){

    var menu = [
      {
        "text": "Menu Heading",
        "heading": "true",
        "translate": "sidebar.heading.HEADER"
      },
      {
        "text": "World",
        "sref": "app.worldview",
        "icon": "fa fa-globe",
        "translate": "sidebar.nav.WORLDVIEW"
      },
      /*{
        "text": "Menu",
        "sref": "#",
        "icon": "icon-folder",
        "submenu": [
          { "text": "Sub Menu", 
            "sref": "app.submenu", 
            "translate": "sidebar.nav.menu.SUBMENU" 
          }    
        ],
        "translate": "sidebar.nav.menu.MENU"
      }*/
    ];
    
    return menu;
  }

});
