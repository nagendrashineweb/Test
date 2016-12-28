define(['jquery', 'rest','pouch', 'user'], function ($, rest, pouch, user) {

  var nodeCache = {};
  var store = pouch('event', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    store = new pouch('event');
  }
  var doneCallback;

  var event_database = {
        init: function(dcb){
          if (dcb) {
            doneCallback = dcb;
          }
          store.destroy(function(err, info) {
            event_database.populateLocalDb(false);
          });
        },

        refresh: function(dcb, lastPull){
          if (dcb) {
            doneCallback = dcb;
          }
          //store.destroy(function(err, info) {
            event_database.populateLocalDb(true, lastPull);
          //});
        },

        refreshTable: function(){
          event_database.getAll(listItems);
        },

        listItems: function(data){
        },

        populateLocalDb: function(doRefresh, lastPull){
          store = pouch('event', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            store = new pouch('event');
          }
          url = 'matches/events/all';
          if (doRefresh) {
            now = new Date(lastPull).toISOString().slice(0, 19).replace('T', ' ');
            console.log(now);
            //date('Y-m-d H:i:s')
            url = 'matches/events/refresh/' + now;
          }
          rest.get(url,'').done(function(data){
            var a = data.length;
            var b = 0;
            if (a == 0 && doneCallback) {
              doneCallback();
            }
            /*store.allDocs({include_docs: false}, function(err, response) {
              console.log(response);
            });*/
            $.each(data, function(i, v){
                //v._id =  Math.random().toString(36).substring(7);
                v._id = "event-" + v.id;
                // console.log(v._id);
                store.get(v._id, function(err, doc) { 
                  if (!err) {
                    v._rev = doc._rev;
                  }
                  //console.log('updated shit');
                  ++b;
                  if (b >= a && doneCallback) {
                    event_database.updateBulk(data, doneCallback);
                  }
                  // store.put(v,function callback(err, result) {
                  //   if (!err) {
                  //     //console.log('Successfully posted a event!!');
                  //   }
                  //   ++b;
                  //   if (b >= a && doneCallback) {
                  //     doneCallback();
                  //   }
                  // });
                });
            });
          }).fail(function() {
            doneCallback();
          });
        },

        updateBulk:function(data, doneCallback) {
          //console.log(data);
          // console.log('updateBulk events');
          store.bulkDocs(data, function(err, response) { doneCallback(); /*console.log('finished updateBulk events'); console.log(err); console.log(response);*/ });
        },

        checkCriteria:function(criteria, record){
          if(record.match_id == criteria){
            return true;
          }
          return false;
        },

        getData: function(event, match, RefreshDataSets){
          var dict = [];
          store.allDocs({include_docs: true}, function(err, response) {
            if (!(response && response.rows)) {
              RefreshDataSets(dict);
              return;
            }
            for(var i = 0; i < response.rows.length; i++){
              if(response.rows[i].doc !== 'undefined'){
                if(event_database.checkCriteria(match, response.rows[i].doc)){
                  //dict[response.rows[i].doc.id + ""] = response.rows[i].doc;
                  dict.push(response.rows[i].doc);
                  //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
                }
                //dict[response.rows[i].doc.id + ""] = response.rows[i].doc;
                //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
              }
              if(i == response.rows.length -1){
                RefreshDataSets(dict);
              }
            }
          });

        },

        getAllData: function(RefreshDataSets){
          var dict = [];
          store.allDocs({include_docs: true}, function(err, response) {
            if (!(response && response.rows)) {
              RefreshDataSets(dict);
              return;
            }
            // console.log("getAllData");
            // console.log(response.rows.length);
            for(var i = 0; i < response.rows.length; i++){
              if(response.rows[i].doc !== 'undefined'){
                // if(event_database.checkCriteria(match, response.rows[i].doc)){
                  //dict[response.rows[i].doc.id + ""] = response.rows[i].doc;
                  dict.push(response.rows[i].doc);
                  //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
                // }
                //dict[response.rows[i].doc.id + ""] = response.rows[i].doc;
                //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
              }
              if(i == response.rows.length -1){
                RefreshDataSets(dict);
              }
            }
          });

        }
  };

  return event_database;

});
