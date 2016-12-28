define(['jquery', 'user', 'parsley', 'rest', 'squad_database', 'general'], function ($, user, parsley, rest, squad_db, general) {

 var competition_id = 'PM';
 var squad_dict;
 var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');

  var standings = {

    init: function(){

      $.event.special.tap2 = {
        setup: function() {
          var self = this,
            $self = $(self);

          var endCoords;

          $self.on("touchmove", function(event) {
              endCoords = event.originalEvent.targetTouches[0];
          });

          $self.on('touchstart', function(startEvent) {
            var target = startEvent.target;
            var y = startEvent.originalEvent.targetTouches[0].pageY;
            var x = startEvent.originalEvent.targetTouches[0].pageX;
            endCoords = startEvent.originalEvent.targetTouches[0];

            $self.one('touchend', function(endEvent) {
              if (target == endEvent.target && Math.abs(endCoords.pageY - y) < 20 && Math.abs(endCoords.pageX - x) < 20) {
                endEvent.preventDefault();
                $.event.simulate('tap2', self, endEvent);
              }
            });
          });
        }
      };

      squad_db.getData(function(data){
        squad_dict = data;

        standings.pullStandings();  
      });
    },

    pullStandings: function(){
      rest.get('standings/get-by-competition/' + competition_id,'').done(function(data){
        $.each(data, function(i, obj){
          $('#standings-table-scrollable tbody').append(standings.constructStandingElement(obj));
        });
        $('.inner-content').css({visibility: 'hidden', display: 'block'});
        $("#standings-table thead td").each(function(index){
            var index2 = index;
            $(this).width(function(index2){
              return $("#standings-table-scrollable tbody td").eq(index).width();
            });
        });

        $('#standings-table-scrollable tr').on(clickEvent, function() {
          window.location.href = 'club_stats.html?team=' + $(this).attr('data-id');
        });

        $('.inner-content').attr("style", "display:none;");
        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        general.hideLoader();
        $('.inner-content').fadeIn();
      });
    },

    constructStandingElement: function(data){
      var a = parseInt(data.goals_scored);
      var b = parseInt(data.goals_conceeded);
      var c = a - b;
      //onclick="document.location = \'club_stats.html?team='+data.team_id+'\';"
      return '<tr data-id="'+data.team_id+'" ><td class="t-first semi-bold">' + data.posistion + '</td><td>' + squad_dict[data.team_id].short_name + '</td><td><span class="t-star"></span><span class="t-rating semi-bold">'+ (Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1) +'</span></td><td>'
      + data.matches_played + '</td><td>' + c + '</td><td class="t-last semi-bold">' + data.points
      +'</td></tr>';
    }
  };

  return standings;

});
