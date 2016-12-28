define(['squad_database', 'player_database', 'stats_database', 'events_database', 'match_database', 'lineups_database'], function (squad_db, player_db, stats_db, event_db, match_db, lineup_db) {

  var count = 4;
  var counter = 0;
  var doneCallback;

  var dataPullProcessor = {

    pullUpData: function(dcb){
      if (dcb) {
        doneCallback = dcb;
      }

      count = 4;

      squad_db.init(dataPullProcessor.increaseCounter);
      player_db.init(dataPullProcessor.increaseCounter);
      //stats_db.init("All", dataPullProcessor.increaseCounter);
      event_db.init(dataPullProcessor.increaseCounter);
      match_db.init(dataPullProcessor.increaseCounter);
      //lineup_db.init(dataPullProcessor.increaseCounter);
    },

    pullUpDataRefresh: function(dcb){
      if (dcb) {
        doneCallback = dcb;
      }

      count = 4;

      var lastPull = window.localStorage.getItem('pull');
      lastPull = parseInt(lastPull);

      squad_db.refresh(dataPullProcessor.increaseCounter, lastPull);
      player_db.refresh(dataPullProcessor.increaseCounter, lastPull);
      //stats_db.init("All", dataPullProcessor.increaseCounter);
      event_db.refresh(dataPullProcessor.increaseCounter, lastPull);
      var notif2 = window.localStorage.getItem('notif2');
      // console.log(notif2);
      if (notif2 == "0" || notif2 === null) {
        console.log("0 or null");
        localStorage.setItem('notif2', "1");
        match_db.init(dataPullProcessor.increaseCounter);
      } else {
        match_db.refresh(dataPullProcessor.increaseCounter, lastPull);  
      }
      
      //lineup_db.init(dataPullProcessor.increaseCounter);
    },

    increaseCounter: function() {
      ++counter;
      if (counter >= count && doneCallback) {
        doneCallback();
      }
    }
  };
    
  return dataPullProcessor;

});
