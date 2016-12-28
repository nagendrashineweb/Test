define(['jquery', 'user', 'rest', 'squad_database', 'player_database'], function ($, user, rest, squad_db, player_db) {

  var squad_dict;
  var squad_id;
  var player_dict;
  var fav_squadid;
  var userObj;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var currentTarget = ".content-squad";

  var squadController = {
    init: function(squad){

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

      $('body').off(clickEvent, currentTarget+' .info-box-dd2 .ib-dd-top');
      $('body').on(clickEvent, currentTarget+' .info-box-dd2 .ib-dd-top', function(){
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
      squad_id = parseInt(userObj.team_id);
      fav_squadid = parseInt(userObj.team_id);
      if (parseInt(squad) >= 0) {
        squad_id = squad;
      }

      squad_db.getData(function(data){
        squad_dict = data;

        $('.title-team-badge').attr('style', 'background-image:url(img/' + squad_dict[squad_id].slug + '_large'+(squad_id == fav_squadid ? '' : '_nf')+'.png); display:block;');
        rest.get('standings/get-by-team/' + squad_id).done(function(data2){
          $(currentTarget+' #selected-team2').html(squad_dict[squad_id].name + '<div class="tb-right">' + (Math.round(parseFloat(data2.rating) * 10)/10.0).toFixed(1) + '</div>');
        });

        player_db.getData(function(data){
          player_dict = data;
          squadController.pullRatingData();
        });
      });
    },

    pullRatingData:function(){
      var myRatings = rest.get('rating/squad/'+squad_id,'').done(function(data){

        $(currentTarget+' #members-container-gk').html('');
        $.each(data, function(index, r){
          $(currentTarget+' #members-container-gk').append(squadController.createRatingElement(r, "Goalkeepers"));
        });

        $(currentTarget+' #members-container-df').html('');
        $.each(data, function(index, r){
          $(currentTarget+' #members-container-df').append(squadController.createRatingElement(r, "Defenders"));
        });

        $(currentTarget+' #members-container-md').html('');
        $.each(data, function(index, r){
          $(currentTarget+' #members-container-md').append(squadController.createRatingElement(r, "Midfielders"));
        });

        $(currentTarget+' #members-container-fw').html('');
        $.each(data, function(index, r){
          $(currentTarget+' #members-container-fw').append(squadController.createRatingElement(r, "Forwards"));
        });

        $('.spinner-overlay').data('display', '1');
        $('.spinner').fadeOut(200);
        $('.spinner-overlay').fadeOut(200);
        $(currentTarget+' .inner-content').fadeIn();
      });
    },

    createRatingElement:function(data, posi){
      var name = player_dict[data.member_id].name;
      var pos = player_dict[data.member_id].posistion;
      if (pos == posi) {
        return '<a class="np-container '+ (data.rating == 0 ? 'not-rated-c' : '') +'" data-mins="'+data.minutes+'" data-ajax="false" href="'+(data.rating == 0 ? '#' : 'player_stats.html?player='+data.member_id)+'"><div class="np-rate-width '+ (data.rating == 0 ? 'not-rated' : '') +'" style="width:' + (Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1)*10 + '%"></div><div class="np-shirt">'+player_dict[data.member_id].shirt_number+'</div><h1 class="np-player">' + player_dict[data.member_id].name + '</h1><h1 class="np-rating '+ (data.rating == 0 ? 'not-rated' : '') +'">' + (Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1) + '</h1></a>';
      } else {
        return "";
      }
    }
  };

  return squadController;

});
