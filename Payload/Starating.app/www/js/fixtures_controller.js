define(['jquery', 'user', 'rest', 'squad_database'], function ($, user, rest, squad_db) {

  var squad_dict;
  var squad_id;
  var fav_squadid;
  var userObj;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var currentTarget = ".content-fixtures";

  var fixturesController = {
    init: function(squad) {

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

      $('body').off(clickEvent, currentTarget+' .info-box-dd3 .ib-dd-top');
      $('body').on(clickEvent, currentTarget+' .info-box-dd3 .ib-dd-top', function(){
        var alreadyActive = false;
        $arr = $(this).find('.arrow-up');
        $el = $(this).parent().find('.ib-dd-content');
        if ($(this).hasClass('ibd3')) {
          $this2 = $(currentTarget+'.content-ghost .info-box-dd3 .ib-dd-top.ibd3');
        } else {
          $this2 = $(currentTarget+'.content-ghost .info-box-dd3 .ib-dd-top.ibd4');
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
      squad_id = parseInt(userObj.team_id);
      fav_squadid = parseInt(userObj.team_id);
      if (parseInt(squad) >= 0) {
        squad_id = squad;
      }

      squad_db.getData(function(data){
        squad_dict = data;
        rest.get('standings/get-by-team/' + squad_id).done(function(data2){
          $(currentTarget+' #selected-team3').html(squad_dict[squad_id].name + '<div class="tb-right">' + (Math.round(parseFloat(data2.rating) * 10)/10.0).toFixed(1) + '</div>');
        });

        $('.title-team-badge').attr('style', 'background-image:url(img/' + squad_dict[squad_id].slug + '_large'+(squad_id == fav_squadid ? '' : '_nf')+'.png); display:block;');

        fixturesController.pullFixtureData(squad_id);
      });
    },

    pullFixtureData:function(sq){
      rest.get('match/allforteam/' + sq).done(function(data){
        $(currentTarget+' #fixtures-container-prev').html('');
        $.each(data, function(i, obj){
          if (obj.score.indexOf('-') != -1) {
            $(currentTarget+' #fixtures-container-prev').append(fixturesController.constructFixtureElement(obj)); 
          } else {
            $(currentTarget+' #fixtures-container').append(fixturesController.constructFixtureElement(obj));
          }
        });
        
        $('.spinner-overlay').data('display', '1');
        $('.spinner').fadeOut(200);
        $('.spinner-overlay').fadeOut(200);
        $(currentTarget+' .inner-content').fadeIn(400, function() {
          $cr = $("#swipe-content li").eq(0);
          $cr.html('');
          $(currentTarget).clone().addClass('content-ghost').appendTo($cr);
        });
      });
    },

    constructFixtureElement: function(data){
      var k = '1';

      var score = data.score;
      score = score.replace(' - ', ':');
      score = score.replace('-', ':');
      score = score.replace('v', 'vs');
      score = score.replace('V', 'vs');
      score = score.replace(' vs ', 'vs');
      score = score.replace(':', ' : ');

      // Split timestamp into [ Y, M, D, h, m, s ]
      var t = data.started.split(/[- :]/);
      var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];
      var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

      // Apply each element to the Date function
      var datetime = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
      //var datetime = Date.parse(data.started);
      dateString = datetime.toString();
      var month = monthNames[datetime.getMonth()];
      var dateString = datetime.getDate();
      dateString += " " + month;
      var hrs = datetime.getHours() + "";
      if (hrs.length < 2) {
        hrs = "0" + hrs;
      }
      var mins = datetime.getMinutes() + "";
      if (mins.length < 2) {
        mins = "0" + mins;
      }
      dateString += " " + datetime.getFullYear();
      var kickoff = hrs + ":" + mins;

      dateString = dayNames[parseInt(datetime.getDay())].substring(0,3) + ' ' + dateString;
      var stadium = squad_dict[data.host_team_id].stadium;
      var tmp = stadium.indexOf("(");
      stadium = stadium.substring(0, tmp);
      stadium = stadium.trim();

      var comp = data.competition_id;

      if (comp == "rom_l1" || comp == "PM" || comp == "eng_pl") {
        comp = "Barclays Premier League";
      }

      return '<div class="fc-fixture"><div class="fc-matchday">Matchday '+ data.game_week +'</div><div class="fc-teams">'+ squad_dict[data.host_team_id].name 
        + ' ' + score + ' ' + squad_dict[data.guest_team_id].name + '</div>'
        + '<div class="fc-details">' + stadium + ' - ' + dateString + ' - KICK OFF: ' + kickoff +'</div>'
        +'</div>';
    }
  };

  return fixturesController;

});
