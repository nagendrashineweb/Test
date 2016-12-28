define(['jquery', 'user', 'rest'], function ($, user, rest) {
  
  var FileIO;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var sel_team_id;

  var team = {
    initialize: function(fio) {

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

      FileIO = fio;
      rest.get('team', '').done(function( result ) {
          $('#team-list').html("");

          // $('#ts-fav-team').html(squad_dict[userObj.team_id].name);
          // $('#ts-fav-team').attr('data-id', userObj.team_id);

          var teamList = '';
          $.each(result, function( index, obj ) {
            if (obj) {
              teamList += '<div class="ts-tl-team" data-id='+obj.id+' data-name="'+obj.name+'"><div class="ts-tl-badge" style="background-image:url(img/' + obj.slug + '_large_nf.png);"></div><div class="ts-tl-name">' + obj.name + '</div></div>';
            }
          });

          // $('.ts-select-team-content').html(teamList);
          $('#team-list').html(teamList);
          teamList = '';

          $('.ts-select-team-content .ts-tl-team').on(clickEvent, function() {
            sel_team_id = parseInt($(this).attr('data-id'));
            $('.ts-select-team').html('<span style="font-weight:600;">Your Team</span><span style="font-weight:200;"> : ' + $(this).attr('data-name') + '</span>');


            var alreadyActive = false;
            $el = $('.ts-select-team').parent();
            $el2 = $('.ts-select-team').parent().find('.ts-select-team-content');
            if ($el.hasClass('active')) {
              alreadyActive = true;
            }

            if (!alreadyActive) {
              $el.addClass('active');
              $el2.slideToggle();
            } else {
              $el2.slideToggle(400, function() {$el.removeClass('active'); $('.ts-subtitle').show();});
            }

            $('#cont-btn').removeClass('inactive');


          });

          $('.ts-select-team').on(clickEvent, function() {
            var alreadyActive = false;
            $el = $(this).parent();
            $el2 = $(this).parent().find('.ts-select-team-content');
            if ($el.hasClass('active')) {
              alreadyActive = true;
            }

            if (!alreadyActive) {
              $('.ts-subtitle').hide();
              $el.addClass('active');
              $el2.slideToggle();
            } else {
              $el2.slideToggle(400, function() {$el.removeClass('active');});
            }
          });
            

          /*$.each(result, function( index, value ) {
            if (value.name == "West Bromwich Albion") {
              value.name = "West Brom Albion";
            } else if (value.name.length >= 20) {
              value.name = value.short_name;
            }
            var content = $('<div/>', {
                id: value.id,
                class: 'team-item',
                html: value.name + "<div class='team-badge' style='background-image:url(img/" + value.slug + "_large_nf.png);'></div>"
            });

            $('#team-list').append(content);
          });*/

          team.applyHandle();
      });
    },

    applyHandle: function(){
      $('#cont-btn').on(clickEvent, function(e){
        if ($(this).hasClass('inactive')) {
          return;
        }
        user.setTeam(sel_team_id, FileIO);
      });
    }
  };

  return team;

});
