define(['jquery', 'rest','pouch'], function ($, rest, pouch) {


  var team_members;

	var nodeCache = {};
  var store = pouch('players', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('players');
  }


  var team_member = {
        init: function(){
          store.destroy(function(err, info) {
            team_member.populateLocalDb();
          });
        },

        refreshTable: function(){
      		team_members.getAll(listItems);
      	},

        listItems: function(data){

        },

        populateLocalDb: function(){
          store = pouch('players', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('players');
          }
          rest.get('squad/get/allmembers','').done(function(data){
            $.each(data, function(i, v){
                //v._id =  new Date().toISOString();
                v._id = "team-members-" + v.id;
                store.put(v,function callback(err, result) {
                  if (!err) {
                    console.log('Successfully posted a player!');
                  }
                });
              });
            });
        },

        getPlayer:function(playerId){

        },

        getData: function(){
          var dict = [];
          store.allDocs({include_docs: true}, function(err, response) {
            console.log('THE RESPONCE IS' + response);
            $.each(responce.rows, function(i , v){
              dict.push({key:v.id, value: v});
            });
          });
            return dict;

        }
  };

  return team_member;

});
