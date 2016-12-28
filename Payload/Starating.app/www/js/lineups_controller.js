define(['jquery', 'user', 'rest', 'squad_database', 'player_database', 'lineups_database'], function ($, user, rest, squad_db, player_db, lineup_db) {
  $( document ).ready(function() {
  });

  var squad_dict;
  var player_dict;
  var lineup_dict;
  var matchId;
  var splitLineups;

  var lineupsController = {

    init: function(match, squad){
      /*squad_db.init();
      player_db.init();
      lineup_db.init();*/

      userId = user.getUserId();

      squadId = squad;
      matchId = match;

      squadid = parseInt(user.getUser().team_id);

      squad_db.getData(function(data){
        squad_dict = data;

        player_db.getData(function(data){
          player_dict = data;

          // lineup_db.getData(function(data){
            // lineup_dict = data;
            lineupsController.pullLineups(matchId, squadId);
          // });
        });
      });
    },

    pullLineups:function(matchId, squad_el){
      var myRatings = rest.get('splitlineup/' + matchId,'').done(function(data){
          //console.log(data);
          //console.log(squad_el);
          splitLineups = data[squad_el];
          //console.log(splitLineups);
          $('#lineup-container').html('<div class="lp-position lp-gk"></div><div class="lp-position lp-def"></div><div class="lp-position lp-mid"></div><div class="lp-position lp-fw"></div>');
          $.each(splitLineups, function(index, r){
            var aRatingElement = $('<a/>', {
                id: '',
                class: 'lineup-player',
                href: 'player_stats.html?player='+r.player_id
            });
            aRatingElement.attr('data-ajax', 'false');
            aRatingElement.append(lineupsController.createRatingElement(r));
            if (parseInt(r.is_sub) == 1) {
              //$('#lineup-container').append(aRatingElement);
            } else if (parseInt(r.posistion_id) == 1) {
              $('#lineup-container .lp-gk').append(aRatingElement);
            } else if (parseInt(r.posistion_id) == 2) {
              $('#lineup-container .lp-def').append(aRatingElement);
            } else if (parseInt(r.posistion_id) == 3) {
              $('#lineup-container .lp-mid').append(aRatingElement);
            } else if (parseInt(r.posistion_id) == 4) {
              $('#lineup-container .lp-fw').append(aRatingElement);
            }
            
          });
      });
    },

    pullRatingData:function(){
      var myRatings = rest.get('rating/squad/' + squadId,'').done(function(data){
        //$('#selected-team').html(squad_dict[teamid].name);
        $('#lineup-container').html("");
        $.each(data, function(index, r){
          var aRatingElement = $('<a/>', {
              id: '',
              class: 'lineup-player',
              href: 'player_stats.html?player='+r.member_id
          });
          aRatingElement.attr('data-ajax', 'false');
          aRatingElement.append(lineupsController.createRatingElement(r));
          $('#lineup-container').append(aRatingElement);
        });
      });
    },

    createRatingElement:function(data){
      //return '<div><h1>Rating: ' + data.rating  + '</h1><h1> Player Id: ' + player_dict[data.member_id].name + '</h1><h1> Team ID: ' + squad_dict[data.squad_id].name +'</h1></div><br/>';
      //console.log(data);
      return '<div class="lp-rating">' + (Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1) + '</div><h1 class="lp-name">' + player_dict[data.player_id].name + '</h1>';
    }
  };

  return lineupsController;

});
