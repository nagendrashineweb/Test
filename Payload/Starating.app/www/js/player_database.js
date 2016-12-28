define(['jquery', 'rest','pouch'], function ($, rest, pouch) {

  var nodeCache = {};
  var store = pouch('players', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('players');
  }
  var doneCallback;

  var player_database = {
        init: function(dcb){
          if (dcb) {
            doneCallback = dcb;
          }
          store.destroy(function(err, info) {
            player_database.populateLocalDb(false);
          });
        },

        refresh: function(dcb, lastPull){
          if (dcb) {
            doneCallback = dcb;
          }
          //store.destroy(function(err, info) {
            player_database.populateLocalDb(true, lastPull);
          //});
        },

        refreshTable: function(){
          player_database.getAll(listItems);
        },

        listItems: function(data){

        },

        populateLocalDb: function(doRefresh, lastPull){
          store = pouch('players', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('players');
          }
          //  rest.get('squad/get/allmembers','').done(function(data){
          url = 'squad/all-squad-members';
          if (doRefresh) {
            //console.log(lastPull);
            //console.log(lastPull.getTime());
            now = new Date(lastPull).toISOString().slice(0, 19).replace('T', ' ');
            //date('Y-m-d H:i:s')
            url = 'squad/all-squad-members/refresh/' + now;
          }
          rest.get(url,'').done(function(data){
            var a = data.length;
            var b = 0;
            if (a == 0 && doneCallback) {
              doneCallback();
            }
            $.each(data, function(i, v){
                //v._id = Math.random().toString(36).substring(7);
                v._id = "players-" + v.id;
                store.get(v._id, function(err, doc) { 
                  if (!err) {
                    v._rev = doc._rev;
                  }
                  ++b;
                  if (b >= a && doneCallback) {
                    player_database.updateBulk(data, doneCallback);
                  }
                  /*store.put(v,function callback(err, result) {
                    if (!err) {
                      //console.log('Successfully posted a player!');
                    }
                    ++b;
                    if (b >= a && doneCallback) {
                      doneCallback();
                    }
                  });*/
                });

            });
          }).fail(function() {
            doneCallback();
          });
        },

        updateBulk:function(data, doneCallback) {
          //console.log(data);
          /*console.log('updateBulk player');*/
          store.bulkDocs(data, function(err, response) { doneCallback(); /*console.log('finished updateBulk player');*/ });
        },

        getScore:function(playerId){},

        getData: function(RefreshDataSets){
          var dict = [];
          store.allDocs({include_docs: true}, function(err, response) {
            if (!(response && response.rows)) {
              RefreshDataSets(dict);
              return;
            }
            for(var i = 0; i < response.rows.length; i++){
              if(response.rows[i].doc !== 'undefined'){
                dict[response.rows[i].doc.id + ""] = response.rows[i].doc;
                //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
              }
              if(i == response.rows.length -1){
                RefreshDataSets(dict);
              }
            }

          });

        }
  };

  return player_database;

});
