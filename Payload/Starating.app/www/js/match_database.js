define(['jquery', 'rest','pouch', 'user'], function ($, rest, pouch, user) {

  var nodeCache = {};
  var store = pouch('matches', {adapter: 'websql'});
  if (!store.adapter || rest.isIOS) { // websql not supported by this browser
    // console.log("indexed");
    store = new pouch('matches');
  }
  var comp_id = 'rom_l1';
  var doneCallback;
  var currentMatchDay = 0;

  var match_database = {
        init: function(dcb){
          if (dcb) {
            doneCallback = dcb;
          }
          store.destroy(function(err, info) {
            match_database.populateLocalDb(false);
          });
        },

        refresh: function(dcb, lastPull){
          if (dcb) {
            doneCallback = dcb;
          }
          //store.destroy(function(err, info) {
            match_database.populateLocalDb(true, lastPull);
          //});
        },

        refreshTable: function(){
          match_database.getAll(listItems);
        },

        listItems: function(data){
        },

        populateLocalDb: function(doRefresh, lastPull){
          store = pouch('matches', {adapter: 'websql'});
          if (!store.adapter || rest.isIOS) { // websql not supported by this browser
            // console.log("indexed");
            store = new pouch('matches');
          }
          url = 'matches/get-match-day/' + comp_id;
          if (doRefresh) {
            now = new Date(lastPull).toISOString().slice(0, 19).replace('T', ' ');
            //date('Y-m-d H:i:s')
            url = 'matches/get-match-day/' + comp_id + '/' + now;
          }
          rest.get(url).done(function(data){
            var a = data.length;
            var b = 0;
            var c = 1;
            if (a == 0 && doneCallback) {
              doneCallback();
            }
            $.each(data, function(i, v){
                //v._id =  Math.random().toString(36).substring(7);
                var d = v.id+"";
                while (d.length < 5) d = "0" + d;
                v._id = "matches-" + d;
                ++c;
                store.get(v._id, function(err, doc) { 
                  // console.log(doc);
                  if (!err) {
                    v._rev = doc._rev;
                  }
                  ++b;
                  if (b >= a && doneCallback) {
                    match_database.updateBulk(data, doneCallback);
                  }
                  // store.put(v,function callback(err, result) {
                  //   if (!err) {
                  //     //console.log('Successfully posted a match!!');
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
          //console.log('updateBulk match');
          store.bulkDocs(data, function(err, response) { doneCallback(); /*console.log('finished updateBulk match');*/ });
        },

        getTeamForm:function(record){
          var home = parseInt(record.homeScore);
          var away = parseInt(record.awayScore);
          if(home == away){
            return 'D';
          }
          else if(away > home){
            return 'L';
          }
            return 'W';
        },

        getCurrentMatchDay: function() {
          // console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-=-= ' + currentMatchDay);
          return currentMatchDay;
        },

        assignMatchDat: function(match){
          return 'match day val';
        },

        areDatesEqual: function(a, b) {
          var t = a.split(/[- :]/);
          var v = b.split(/[- :]/);
          return (t[0] == v[0] && t[1] == v[1] && t[2] == v[2]);
        },

        getData: function(RefreshDataSets){
          var dict = [];
          var prevmd = "";
          var md = 0;
          var maxGameWeek = -1;
          currentMatchDay = -1;
          store.allDocs({include_docs: true}, function(err, response) {
            if (!(response && response.rows)) {
              RefreshDataSets(dict);
              return;
            }
            // console.log("getting data from match.db with length " + response.rows.length);
            for(var i = 0; i < response.rows.length; i++){
              if(response.rows[i].doc !== 'undefined'){
                //console.log(response.rows[i].doc);
                var splitScore = response.rows[i].doc.score.split("-");
                var record = response.rows[i].doc;
                record.homeScore = splitScore[0];
                record.awayScore = splitScore[1];
                if (!record.awayScore || record.awayScore === null) {
                  record.awayScore = "";
                }
                record.TeamForm = match_database.getTeamForm(record);
                
                //OLD MATCH DAYS
                /*if (!match_database.areDatesEqual(prevmd, record.started)) {
                  prevmd = record.started;
                  md ++;

                  if (currentMatchDay < 1) {
                    //console.log(prevmd);
                    // Split timestamp into [ Y, M, D, h, m, s ]
                    var t = prevmd.split(/[- :]/);
                    // Apply each element to the Date function
                    mdd = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
                    //mdd = new Date(prevmd);
                    now = new Date();
                    //console.log(mdd);
                    //console.log(now);
                    if (mdd.getYear() > now.getYear()) {
                      currentMatchDay = md;
                      //alert('matchDay ' + currentMatchDay);
                    } else if (mdd.getYear() == now.getYear()) {
                      if (mdd.getMonth() > now.getMonth()) {
                        currentMatchDay = md;
                        //alert('matchDay ' + currentMatchDay);
                      } else if (mdd.getMonth() == now.getMonth()) {
                        if (mdd.getDate() >= now.getDate()) {
                          currentMatchDay = md;
                          //alert('matchDay ' + currentMatchDay);
                        }
                      }
                    }
                  }
                  
                }
                record.matchDay = md;*/

                // console.log(record.game_week);

                // NEW GAME WEEKS
                if (parseInt(record.game_week) > currentMatchDay) {
                  // Split timestamp into [ Y, M, D, h, m, s ]
                  var t = record.started.split(/[- :]/);
                  // Apply each element to the Date function
                  mdd = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
                  //mdd = new Date(prevmd);
                  now = new Date();
                  //now = new Date(2014, 10, 22, 10, 10, 10);
                  // console.log(mdd);
                  // console.log(now);
                  // console.log(currentMatchDay);
                  // console.log(mdd.getMonth());
                  if (mdd.getYear() < now.getYear()) {
                    if (currentMatchDay < parseInt(record.game_week)) {
                      currentMatchDay = parseInt(record.game_week);
                      // console.log("changed md1 to " + currentMatchDay);
                    }
                  } else if (mdd.getYear() == now.getYear()) {
                    if (mdd.getMonth() < now.getMonth()) {
                      if (currentMatchDay < parseInt(record.game_week)) {
                          currentMatchDay = parseInt(record.game_week);
                          // console.log("changed md2 to " + currentMatchDay);
                      }
                    } else if (mdd.getMonth() == now.getMonth()) {
                      if (mdd.getDate() <= now.getDate()) {
                        if (currentMatchDay < parseInt(record.game_week)) {
                          currentMatchDay = parseInt(record.game_week);
                          // console.log("changed md3 to " + currentMatchDay);
                        }
                      }
                    }
                  } 
                }

                if (maxGameWeek < parseInt(record.game_week)) {
                  maxGameWeek = parseInt(record.game_week);
                  // console.log("changing maxGameWeek to " + record.game_week);
                }

                /*// GAME WEEKS
                if (currentMatchDay < 1) {
                  console.log(prevmd);
                  // Split timestamp into [ Y, M, D, h, m, s ]
                  var t = record.started.split(/[- :]/);
                  // Apply each element to the Date function
                  mdd = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
                  //mdd = new Date(prevmd);
                  now = new Date();
                  //now = new Date(2014, 10, 22, 10, 10, 10);
                  console.log(mdd);
                  console.log(now);
                  console.log(currentMatchDay);
                  if (mdd.getYear() > now.getYear()) {
                    currentMatchDay = record.game_week;
                    alert('matchDay a ' + currentMatchDay);
                  } else if (mdd.getYear() == now.getYear()) {
                    if (mdd.getMonth() > now.getMonth()) {
                      currentMatchDay = record.game_week;
                      alert('matchDay b ' + currentMatchDay);
                    } else if (mdd.getMonth() == now.getMonth()) {
                      if (mdd.getDate() >= now.getDate()) {
                        currentMatchDay = record.game_week;
                         alert('matchDay c ' + currentMatchDay);
                      }
                    }
                  }
                  if (currentMatchDay < 1) {
                    console.log("record " + record.game_week);
                    if (maxGameWeek < parseInt(record.game_week)) {
                      maxGameWeek = parseInt(record.game_week);
                      console.log("changing maxGameWeek to " + record.game_week);
                    }
                  } else if (currentMatchDay > 0) {
                    console.log("currentMatchDay got changed to " + currentMatchDay);
                    if (mdd.getDate() == now.getDate()) {
                      maxGameWeek = parseInt(record.game_week);
                      console.log("changing maxGameWeek to currentMatchDay " + record.game_week);
                    } 
                  }
                  //console.log("currentMatchDay");
                  //console.log(currentMatchDay);
                }*/
                record.matchDay = record.game_week;

                //record.matchDay = match_database.assignMatchDat(record);
                dict[response.rows[i].doc.id + ""] = record;
                //console.log('pushing to dictionary: ' + i + JSON.stringify(response.rows[i].doc));
              }
              if(i == response.rows.length -1){
                // console.log("the currentMatchDay");
                // console.log(currentMatchDay);
                // console.log(maxGameWeek);
                // if (maxGameWeek != -1) {
                if (currentMatchDay === -1) {
                  currentMatchDay = maxGameWeek;
                }
                RefreshDataSets(dict);
              }
            }
          });

        }
  };

  return match_database;

});
