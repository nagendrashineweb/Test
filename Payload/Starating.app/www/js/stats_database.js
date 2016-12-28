define(['jquery', 'rest','pouch', 'user'], function ($, rest, pouch, user) {

  var nodeCache = {};
  var store = pouch('stats', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('stats');
  }
  var type;
  var doneCallback;

  var stats_database = {
        init: function(pos, dcb){
          if (dcb) {
            doneCallback = dcb;
          }
          store.destroy(function(err, info) {
            type = pos;
            stats_database.populateLocalDb(false);
          });
        },

        refresh: function(pos, dcb, lastPull){
          if (dcb) {
            doneCallback = dcb;
          }
          //store.destroy(function(err, info) {
            type = pos;
            stats_database.populateLocalDb(true, lastPull);
          //});
        },

        refreshTable: function(){
          stats_database.getAll(listItems);
        },

        listItems: function(data){
        },

        populateLocalDb: function(doRefresh, lastPull){
          store = pouch('stats', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('stats');
          }
          url = 'stats/globalTop/'+ type +'/20';
          if (doRefresh) {
            now = new Date(lastPull).toISOString().slice(0, 19).replace('T', ' ');
            //date('Y-m-d H:i:s')
            url = 'stats/globalTop/'+ type +'/20/' + now;
          }
          rest.get(url,'').done(function(data){
            var a = data.length;
            var b = 0;
            if (a == 0 && doneCallback) {
              doneCallback();
            }
            $.each(data, function(i, v){
                //v._id =  Math.random().toString(36).substring(7);
                v._id = "stats-" + v.id;
                store.get(v._id, function(err, doc) { 
                  if (!err) {
                    v._rev = doc._rev;
                  }
                  store.put(v,function callback(err, result) {
                    if (!err) {
                      // console.log('Successfully posted a global stat!!');
                    } else {
                      console.log('ERROR posting a global stat');
                    }
                    ++b;
                    if (b >= a && doneCallback) {
                      doneCallback();
                    }
                  });
                });
                
            });
          }).fail(function() {
            doneCallback();
          });
        },


        getData: function(RefreshDataSets){
          var dict = [];
          store.allDocs({include_docs: true}, function(err, response) {
            if (!(response && response.rows)) {
              RefreshDataSets(dict);
              return;
            }
            for(var i = 0; i < response.rows.length; i++){
              if(response.rows[i].doc !== 'undefined'){
                //  dict[response.rows[i].doc.id + ""] = response.rows[i].doc;
                dict[response.rows[i].doc.member_id + ""] = response.rows[i].doc;
                  //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
              }
              //console.log('index: ' + i + 'row lenght' + response.rows.length);
              if(i == response.rows.length -1){
                RefreshDataSets(dict);
              }
            }
          });

        }
  };

  return stats_database;

});
