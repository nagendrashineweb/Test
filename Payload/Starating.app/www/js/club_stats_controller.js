define(['jquery', 'user', 'rest', 'squad_database', 'player_database', 'general'], function ($, user, rest, squad_db, player_db, general) {

  var squad_dict;
  var squad_id;
  var player_dict;
  var userObj;
  var loadCount = 0;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var currentTarget = ".content-stats";

  var clubStatsController = {
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

      // $(currentTarget+' .info-box-dd .ib-dd-top').off();
      $('body').off(clickEvent, currentTarget+' .info-box-dd .ib-dd-top');
      $('body').on(clickEvent, currentTarget+' .info-box-dd .ib-dd-top', function(){
        var alreadyActive = false;
        $arr = $(this).find('.arrow-up');
        $el = $(this).parent().find('.ib-dd-content');
        if ($(this).hasClass('ibd1')) {
          $this2 = $(currentTarget+'.content-ghost .info-box-dd .ib-dd-top.ibd1');
        } else {
          $this2 = $(currentTarget+'.content-ghost .info-box-dd .ib-dd-top.ibd2');
        }
        $arrg = $this2.find('.arrow-up');
        $elg = $this2.parent().find('.ib-dd-content');
        if ($el.hasClass('active')) {
          alreadyActive = true;
        }

        if (!alreadyActive) {
          $el.addClass('active');
          $el.slideToggle();
          $arr.addClass('open');
          $elg.addClass('active');
          $elg.slideToggle();
          $arrg.addClass('open');
        } else {
          $el.removeClass('active');
          $el.slideToggle();
          $arr.removeClass('open');
          $elg.removeClass('active');
          $elg.slideToggle();
          $arrg.removeClass('open');
        }
      });

      userObj = user.getUser();
      fav_squad_id = parseInt(userObj.team_id);
      squad_id = parseInt(userObj.team_id);
      if (parseInt(squad) >= 0) {
        squad_id = squad;
      }

      squad_db.getData(function(data){
        squad_dict = data;

        $('body').addClass('bg-'+squad_dict[squad_id].slug);
        rest.get('standings/get-by-team/' + squad_id).done(function(data2){
          $(currentTarget+' #selected-team').html(squad_dict[squad_id].name + '<div class="tb-right">' + (Math.round(parseFloat(data2.rating) * 10)/10.0).toFixed(1) + '</div>');

          var temp = parseInt(data2.posistion);
          if (temp % 10 == 1) {
            temp = temp + "st";
          } else if (temp % 10 == 2) {
            temp = temp + "nd";
          } else if (temp % 10 == 3) {
            temp = temp + "rd";
          } else {
            temp = temp + "th";
          }
          $(currentTarget+' #team-position').html(temp);
        });
        
        $(currentTarget+' #team-manager').html(squad_dict[squad_id].manager);
        $(currentTarget+' #team-stadium').html(squad_dict[squad_id].stadium);
        $(currentTarget+' #team-founded').html(squad_dict[squad_id].founded);

        clubStatsController.pullNextPrevData(squad_id);
        
        //$('.title-team-badge').attr('style', 'background-image:url(img/' + squad_dict[squad_id].slug + '_large'+(squad_id == fav_squad_id ? '' : '_nf')+'.png); display:block;');

        player_db.getData(function(data){
          player_dict = data;
          loadCount = 0;
          clubStatsController.pullTypePlayers('top');
          clubStatsController.pullTypePlayers('bottom');
        });
      });

    },

    pullNextPrevData:function(sq){
      match_day = window.localStorage.getItem('cmd');

      rest.get('match/nextprevforteam/' + sq + '/' + match_day + '/' + userObj.id).done(function(data){

        $(currentTarget+' #team-next-match').html(squad_dict[data.next_team_id].name + ' ' + (data.next_at_home ? '(HOME)' : '(AWAY)'));
        $(currentTarget+' #team-next-href').attr('href', 'club_stats.html?team='+ data.next_team_id);

        prev_href = '';
        if (data.has_rated) {
          prev_href += 'my_rating.html?match=' + data.prev_match_id;
        } else {
          prev_href += 'player_rating.html?match=' + data.prev_match_id;
        }

        $(currentTarget+' #team-prev-match').html(squad_dict[data.prev_team_id].name + ' ' + (data.prev_at_home ? '(HOME)' : '(AWAY)'));
        $(currentTarget+' #team-prev-href').attr('href', prev_href);
      });
    },

    pullTypePlayers:function(ptype){
      rest.get('squad/'+ptype+'-players/' + squad_id + '/3','').done(function(data){
        if (data.length > 0) {
          $(currentTarget+' #team-'+ptype+'-players').html('');
          for (var it=0; it<3; ++it) {
            $(currentTarget+' #team-'+ptype+'-players').append('<a class="np-container" data-ajax="false" href="player_stats.html?player='+data[it].member_id+'"><div class="np-rate-width" style="width:' + (Math.round(parseFloat(data[it].rating) * 10)/10.0).toFixed(1)*10 + '%"></div><div class="np-shirt">'+player_dict[data[it].member_id].shirt_number+'</div><h1 class="np-player">' + player_dict[data[it].member_id].name + '</h1><h1 class="np-rating">' + (Math.round(parseFloat(data[it].rating) * 10)/10.0).toFixed(1) + '</h1></a>');
          }
        } else {
          $(currentTarget+' #team-'+ptype+'-players').html("<span style='padding: 10px; font-size: 22px; text-align: center; display: block; width: calc(100% - 20px);'>No "+ptype+" players available!</span>");
        }

        ++loadCount;
        if (loadCount >= 2) {
          // $('.spin2ner-overlay').data('display', '1');
          // $('.spin2ner').fadeOut(200);
          // $('.spin2ner-overlay').fadeOut(200);
          general.hideLoader();
          $(currentTarget+' .inner-content').fadeIn(400, function() {
            $cr = $("#swipe-content li").eq(4);
            $cr.html('');
            $(currentTarget).clone().addClass('content-ghost').appendTo($cr);
          });
        }
      });
    }
  };

  return clubStatsController;

});
