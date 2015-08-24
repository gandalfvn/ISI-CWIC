/**
 * Created by wjwong on 7/26/15.
 */
Meteor.startup(function () {
  var userlist = [
    {username: 'wjwong@gmail.com', roles: ['admin'], pwd: 'WeAreWeaver'},
    {username: 'marcu@isi.edu', roles: ['admin'], pwd: 'WeAreWeaver'},
    {username: 'wjwong+agent@gmail.com', roles: ['agent'], pwd: 'testtest'},
    {username: 'wjwong+super@gmail.com', roles: ['super'], pwd: 'testtest'},
    {username: 'marcu+agent@isi.edu', roles: ['agent'], pwd: 'WeAreWeaver'},
    {username: 'gwen@example.com', roles: ['agent'], pwd: 'wongwong'},
    {username: 'ethan@example.com', roles: ['agent'], pwd: 'wongwong'},
    {username: 'maya@example.com', roles: ['agent'], pwd: 'marcumarcu'},
    {username: 'zara@example.com', roles: ['agent'], pwd: 'marcumarcu'}
  ]

  _.each(userlist, function(usr){
    if(!Meteor.users.findOne({username: usr.username})){
      try{
        var userid = Accounts.createUser({
          username: usr.username,
          email: usr.username,
          password: usr.pwd,
          profile: {roles: usr.roles}
        });
        console.warn(usr.username, userid)
      }
      catch(err){
        console.warn(err)
      }
    }
  })
});