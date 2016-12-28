define(['jquery', 'rest','pouch', 'squad_database'], function ($, rest, pouch, squad_db) {

  var nodeCache = {};
  var store = pouch('fixtures', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('fixtures');
  }


  var fixtures = {
        init: function(){
          store.destroy(function(err, info) {
            squad_db.init();
            fixtures.populateLocalDb();
          });
        },

        refreshTable: function(){
          fixtures.getAll(listItems);
        },

        listItems: function(data){

        },

        populateLocalDb: function(){
          store = pouch('fixtures', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('fixtures');
          }
          rest.get('squad/get/allmembers','').done(function(data){
            $.each(data, function(i, v){
                //v._id =  new Date().toISOString();
                v._id = "fixtures-" + v.id;
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
          console.log('CALLED GET DATA' + store);
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

  return fixtures;

});
