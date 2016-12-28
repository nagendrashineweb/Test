define(['jquery', 'rest','pouch', 'user'], function ($, rest, pouch, user) {

  var nodeCache = {};
  var store = pouch('squad', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('squad');
  }
  var doneCallback;

  var squad_database = {
        init: function(dcb){
          if (dcb) {
            doneCallback = dcb;
          }
          store.destroy(function(err, info) {
            squad_database.populateLocalDb(false);
          });
        },

        refresh: function(dcb, lastPull){
          if (dcb) {
            doneCallback = dcb;
          }
          //store.destroy(function(err, info) {
            squad_database.populateLocalDb(true, lastPull);
          //});
        },

        refreshTable: function(){
          squad_database.getAll(listItems);
        },

        listItems: function(data){
        },

        populateLocalDb: function(doRefresh, lastPull){
          store = pouch('squad', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('squad');
          }
          url = 'squad/getAll';
          if (doRefresh) {
            now = new Date(lastPull).toISOString().slice(0, 19).replace('T', ' ');
            //date('Y-m-d H:i:s')
            url = 'squad/refresh/' + now;
          }
          rest.get(url,'').done(function(data){
            //console.log('squad init');
            var a = data.length;
            var b = 0;
            if (a == 0 && doneCallback) {
              doneCallback();
            }
            $.each(data, function(i, v){
            //  console.log('squad init:' + JSON.stringify(v) + err);
                //v._id =  Math.random().toString(36).substring(7);
                v._id = "squad-" + v.id;
                store.get(v._id, function(err, doc) { 
                  if (!err) {
                    v._rev = doc._rev;
                  }
                  store.put(v,function callback(err, result) {
                    //console.log('squad init:' + JSON.stringify(v) + err);
                    if (!err) {
                      //console.log('Successfully posted a squad!');
                    } else {
                      console.log(err);
                      console.log(result);
                    }
                    ++b;
                    if (b >= a && doneCallback) {
                      doneCallback();
                    }
                  });
                });
                //console.log(v._rev);
                //v._rev = "1-" + (new Date().getTime());
                //v._rev = "1-32dd105489cbd42d1ad12dc5fe59e07d";
                //console.log(v._rev);
                
            });
          }).fail(function() {
            doneCallback();
          });
        },

        getPlayer:function(playerId){},

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

  return squad_database;

});
