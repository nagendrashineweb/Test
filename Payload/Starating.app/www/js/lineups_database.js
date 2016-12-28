define(['jquery', 'rest','pouch'], function ($, rest, pouch) {

  var nodeCache = {};
  var store = pouch('lineups', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('lineups');
  }
  var doneCallback;

  var lineups = {
        init: function(dcb){
          if (dcb) {
            doneCallback = dcb;
          }
          store.destroy(function(err, info) {
            lineups.populateLocalDb();
          });
        },

        refreshTable: function(){
          fixtures.getAll(listItems);
        },

        listItems: function(data){

        },

        populateLocalDb: function(){
          store = pouch('lineups', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('lineups');
          }
          rest.get('lineup/all','').done(function(data){
            var a = data.length;
            var b = 0;
            $.each(data, function(i, v){
                //v._id =  new Date().toISOString();
                //v._id =  Math.random().toString(36).substring(7);
                v._id = "lineups-" + v.id;
                //console.log(v);
                store.put(v,function callback(err, result) {
                  if (!err) {
                    //console.log('Successfully posted a lineup!');
                  } else {
                    console.log(err);
                  }
                  ++b;
                  if (b >= a && doneCallback) {
                    doneCallback();
                  }
                });
              });
            });
        },

        getData: function(f){
          var dict = [];
          store.allDocs({include_docs: true}, function(err, response) {
            $.each(response.rows, function(i , v){
              dict.push({key:v.id, value: v});
            });

            f(dict);
          });

          //return dict;
        }
  };

  return lineups;

});
