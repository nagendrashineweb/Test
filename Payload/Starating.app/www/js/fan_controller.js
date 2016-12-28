define(['jquery', 'user', 'rest', 'squad_database', 'player_database', 'general'], function ($, user, rest, squad_db, player_db, general) {
  $( document ).ready(function() {
  });

  var squad_dict;
  var squad_id;
  var player_dict;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var userObj;
  var fanController = {

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

      $('.header-back').on(clickEvent, function(e) {
        window.history.back();
      });

      $('.info-box-dd .ib-dd-top').off();
      $('.info-box-dd .ib-dd-top').on(clickEvent, function(){
        var alreadyActive = false;
        $arr = $(this).find('.arrow-up');
        $el = $(this).parent().find('.ib-dd-content');
        if ($el.hasClass('active')) {
          alreadyActive = true;
        }

        if (!alreadyActive) {
          $el.addClass('active');
          $el.slideToggle();
          $arr.addClass('open');
        } else {
          $el.removeClass('active');
          $el.slideToggle();
          $arr.removeClass('open');
        }
      });

      userObj = user.getUser();
      userId = userObj.id;
      fav_squad_id = parseInt(userObj.team_id);
      squad_id = parseInt(userObj.team_id);

      squad_db.getData(function(data){
        squad_dict = data;

        // $('body').attr('style', 'background-image:url("img/bgs/' + squad_dict[squad_id].slug +'.png");');
        $('.title-team-badge').attr('style', 'background-image:url(img/' + squad_dict[squad_id].slug + '_large'+(squad_id == fav_squad_id ? '' : '_nf')+'.png); display:block;');
        $('.fav-team-link').attr('href', 'club_stats.html?team='+fav_squad_id);

        $('#title-username').html(userObj.first_name + ' ' + userObj.last_name);
        // var year = userObj.dob;
        // year = year.substring(0, 4);
        $('#fan-fav-team').html(squad_dict[squad_id].name);// + ' fan since ' + year);

        fanController.pullFanData(userId);
      });

    },

    pullFanData:function(uid) {
      rest.get('fan/data/' + uid).done(function(data){
        $('#fan-matches').text(data.matches_rated);

        if (data.ratingTop.length > 0) {
          for (var it=0; it<data.ratingTop.length; ++it) {
            $('#team-top-players').append('<a class="rating-player f-player" data-ajax="false" href="player_stats.html?player='+data.ratingTop[it].member_id+'"><div class="np-rate-width" style="width:' + (Math.round(parseFloat(data.ratingTop[it].total_rating) * 10)/10.0).toFixed(1)*10 + '%"></div><div class="st-team-badge" style="background-image:url(img/' + squad_dict[data.ratingTop[it].team_id].slug + '_large'+(parseInt(data.ratingTop[it].team_id) == fav_squad_id ? '' : '_nf')+'.png);"></div><h1 class="re-player fan-player">' + data.ratingTop[it].name + '</h1><h1 class="re-rating">' + (Math.round(parseFloat(data.ratingTop[it].total_rating) * 10)/10.0).toFixed(1) + '</h1><p class="score fan-score">' + (Math.round(parseFloat(data.ratingTop[it].rating) * 10)/10.0).toFixed(1) + '</p></a>');
          }
        }

        if (data.ratingBottom.length > 0) {
          for (var it=0; it<data.ratingBottom.length; ++it) {
            $('#team-bottom-players').append('<a class="rating-player f-player" data-ajax="false" href="player_stats.html?player='+data.ratingBottom[it].member_id+'"><div class="np-rate-width" style="width:' + (Math.round(parseFloat(data.ratingBottom[it].total_rating) * 10)/10.0).toFixed(1)*10 + '%"></div><div class="st-team-badge" style="background-image:url(img/' + squad_dict[data.ratingBottom[it].team_id].slug + '_large'+(parseInt(data.ratingBottom[it].team_id) == fav_squad_id ? '' : '_nf')+'.png);"></div><h1 class="re-player fan-player">' + data.ratingBottom[it].name + '</h1><h1 class="re-rating">' + (Math.round(parseFloat(data.ratingBottom[it].total_rating) * 10)/10.0).toFixed(1) + '</h1><p class="score fan-score">' + (Math.round(parseFloat(data.ratingBottom[it].rating) * 10)/10.0).toFixed(1) + '</p></a>');
          }
        }

        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        general.hideLoader();
        $('.inner-content').fadeIn();
      });
    }
  };

  return fanController;

});
