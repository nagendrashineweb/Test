define(['jquery', 'user', 'rest', 'squad_database', 'player_database', 'events_database', 'match_database', 'general'], function ($, user, rest, squad_db, player_db, event_db, match_db, general) {
  $( document ).ready(function() {
  });

  var squad_dict;
  var player_dict;
  var match_day_dict;
  var match_dict;
  var event_dict;

  var teamid;
  var comp_id;
  var match_id;
  var event_type;
  var currentMatchDay = 1;
  var nowMatchDay = 1;
  var fav_squadid;
  var userId;
  var currentTarget = ".content.ui-page-active";
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var loadedDay = [];
  var pageToMD = [];

  var openDrawer = -1;
  var initDrawer = true;

  var matchDayController = {

    init: function(setMD, md, onboard){
      comp_id = 'rom_l1';
      userObj = user.getUser();
      userId = userObj.id;

      for (var it=0; it<40; ++it) {
        loadedDay[it] = false;
      }

      fav_squadid = parseInt(userObj.team_id);

      squad_db.getData(function(data){
        squad_dict = data;

        player_db.getData(function(data){
          player_dict = data;

          match_db.getData(function(data){
            match_dict = data;
            currentMatchDay = match_db.getCurrentMatchDay();
            console.log(currentMatchDay);
            console.log("stuff is loaded");
            if (md) {
              if (parseInt(md) != parseInt(currentMatchDay) && (parseInt(md) > 0)) {
                currentMatchDay = md;
              }
            }
            setMD(currentMatchDay);
            
            localStorage.removeItem('cmd');
            localStorage.setItem("cmd", match_db.getCurrentMatchDay());
            nowMatchDay = match_db.getCurrentMatchDay();

            if ($(currentTarget).hasClass('c-initial')) {
              $(currentTarget).removeClass('c-initial');
              $(currentTarget).addClass('content-' + currentMatchDay);
            }

            event_db.getAllData(function(evd){
              event_dict = evd;

              if (onboard) {
                $('.header-back').on(clickEvent, function(e) {
                  window.location.href = "dashboard.html";
                });
                matchDayController.getMatchesForOnboard(currentMatchDay, comp_id);
                return;
              }

              matchDayController.getMatchesForDay(currentMatchDay, comp_id, 40);

              // console.log(currentMatchDay);
              var j = currentMatchDay;
              pageToMD[0] = (j-1 < 1 ? 38 : j-1);
              for (var it=1; it < 40; ++it) {
                pageToMD[it] = j;
                ++j;
                if (j > 38) {
                  j = 1;
                }
              }
              // console.log(pageToMD);

              var leftPage = 38;
              var rightPage = 2;
              currentMatchDay = parseInt(currentMatchDay);
              lmd = currentMatchDay - 1;
              rmd = currentMatchDay + 1;
              lmd = (lmd < 1 ? 38 : lmd);
              rmd = (rmd > 38 ? 1 : rmd);

              //openDrawer = 

              //left
              $cr = $("#swipe-content li").eq(leftPage);
              $cr.find('.content').addClass('ui-page-active');
              $cr.find('.content').removeClass('c-initial');
              $cr.find('.content').addClass('content-' + lmd);

              setMD(lmd, lmd);
              matchDayController.getMatchesForDay(lmd, comp_id, 1);

              //right
              $cr = $("#swipe-content li").eq(rightPage);
              $cr.find('.content').addClass('ui-page-active');
              $cr.find('.content').removeClass('c-initial');
              $cr.find('.content').addClass('content-' + rmd);

              setMD(rmd, rmd);
              matchDayController.getMatchesForDay(rmd, comp_id);

              loadedDay[currentMatchDay] = true;
              loadedDay[lmd] = true;
              loadedDay[rmd] = true;
            });
            
          });// END match_db
        });// END player_db
      });// END squad_db
    },

    getLoadedForDay:function(d) {
      return loadedDay[d];
    },

    getDayForPage:function(p) {
      return pageToMD[p];
    },

    /*
      Separate Init method to be called once only
      Contains event listeners 
    */
    furtherInit:function() {

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

      $('body').on(clickEvent, '.sr-f-events-container .long-button', function(e) {
        e.preventDefault();
        if ($(this).hasClass('inactive')) {
          return;
        }
         window.location.href = $(this).attr('data-href');
      });

      $('body').on(clickEvent, '.sr-fixture .sr-f-top-container', function(){
        var alreadyActive = false;
        $el = $(this).parent().find('.sr-f-events-container');
        if ($el.hasClass('active')) {
          alreadyActive = true;
        }
        $el2 = $(this);
        $('.sr-f-events-container.active').slideUp();
        $('.sr-f-events-container.active').removeClass('active');

        if (!alreadyActive) {
          $el.addClass('active');
          openDrawer = $(this).parent().attr('data-match-id');
          $el.slideToggle();
          nr = parseInt($(this).parent().attr('data-nr'));
          $('.inner-content').animate({
            scrollTop: /*62 +*/ (57*nr)
          }, 400);
        } else {
          openDrawer = null;
        }
      });
    },

    getOpenDrawer:function() {
      return openDrawer;
    },

    setOpenDrawer:function(od) {
      openDrawer = od;
    },

    getCurrentMatchDay:function() {
      return currentMatchDay;
    },

    getMatchesForDay:function(day, comp_id, clonePage, repullEvents){

      if (repullEvents) {
        event_db.getAllData(function(evd){
          event_dict = evd;
          matchDayController.getMatchesForDay(day, comp_id);
        });
        console.log("repullEvents");
        return;
      }

      console.log("getMatchesForDay " + day);
      tmpDay = parseInt(day);
      loadedDay[tmpDay] = true;
      rest.get('match/getMatchDay/' + tmpDay + '/' + comp_id + '/' + userId).done(function(data){
        match_day_dict = data;

        if (!$('.content-'+day).hasClass('ui-page-active')) {
          $('.content-'+day).addClass('ui-page-active');
        }

        var count = 0;
        var fav = 0;
        $('.content-'+day+'.ui-page-active #other-fixtures').html('');
        $.each(data, function(i, obj){
          if (obj.host_team_id == fav_squadid || obj.guest_team_id == fav_squadid) {
            fav = i;
          }
        });
        
        itr = 0;
        $.each(data, function(i, obj){

          if (initDrawer && day == currentMatchDay) {
            openDrawer = null;
          }
            
            if (count == fav) {
              $('.content-'+day+'.ui-page-active #main-fixture').html(matchDayController.createMatchDayElements(obj, day, 0));
              if (openDrawer == null) {
                $('.content-'+day+'.ui-page-active #main-fixture').find('.sr-f-events-container').show();
                $('.content-'+day+'.ui-page-active #main-fixture').find('.sr-f-events-container').addClass('active');
                openDrawer = obj.id;
                initDrawer = false;
              }
            } else {
              itr ++;
              $('.content-'+day+'.ui-page-active #other-fixtures').append(matchDayController.createMatchDayElements(obj, day, itr));
            }

            count ++;
        });

        if (openDrawer != null && !initDrawer) {
          $('.sr-fixture-' + openDrawer).find('.sr-f-events-container').show();
          $('.sr-fixture-' + openDrawer).find('.sr-f-events-container').addClass('active');
        }

        if (clonePage) {
          clonePage --;
          $cr = $("#swipe-content li").eq(clonePage);
          $cr.html('');
          $('.content-'+day+'.ui-page-active').clone().appendTo($cr);
        }

        // Showing content
        // $('.spinner-overlay').attr('data-display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        // $('.spinner-text').fadeOut(200);
        // $('.spinner-text-slow').fadeOut(200);
        // $('.spinner-text-nowebs').fadeOut(200);
        general.hideLoader();
        $('.content-'+day+'.ui-page-active .inner-content').fadeIn(); // NOT FOR ANDROID
        // $('.content-'+day+'.ui-page-active .inner-content').show(); // FOR ANDROID ONLY

      }).fail(function() {
        general.hideLoader();
        general.showNoInternet();
        // $('.spinner-overlay').attr('data-display', '1');
        // $('.spinner').hide();
        // $('.spinner-text').hide();
        // $('.spinner-text-slow').hide();
        // $('.spinner-text-nowebs').show(200);
        // $('.spinner-overlay').fadeIn(200);
      });
    },

    getMatchesForOnboard:function(day, comp_id){
      tmpDay = parseInt(day);
      rest.get('match/getMatchesOnboard/' + tmpDay + '/' + comp_id + '/' + fav_squadid + '/' + userId).done(function(data){
        match_day_dict = data;

        var count = 0;
        var fav = 0;
        $('.content #other-fixtures').html('');
        $.each(data, function(i, obj){
          if (obj.host_team_id == fav_squadid || obj.guest_team_id == fav_squadid) {
            fav = i;
          }
        });
        
        itr = 0;
        var createdMain = false;
        $.each(data, function(i, obj){
           
          if (count == fav && !createdMain) {
            createdMain = true;
            $('.content #main-fixture').html(matchDayController.createMatchDayElements(obj, day, 0));
          } else {
            if (itr < 2) {
              itr ++;
              $('.content #other-fixtures').append(matchDayController.createMatchDayElements(obj, day, itr));
            }
          }

          count ++;
        });

        $('body').off(clickEvent, '.sr-f-events-container .long-button');
        $('body').on(clickEvent, '.sr-f-events-container .long-button', function(e) {
          e.preventDefault();
          if ($(this).hasClass('inactive')) {
            return;
          }
          var link = $(this).attr('data-href').replace('my_rating', 'onboard3');
          link = link.replace('player_rating', 'onboard2');
          window.location.href = link;
        });

        general.hideLoader();
        $('.content .inner-content').fadeIn();

      }).fail(function() {
        general.hideLoader();
        general.showNoInternet();
      });
    },

    createMatchDayElements:function(data, day, itr){

      var ret = '<div class="sr-fixture sr-fixture-' + data.id + '" data-match-id="' + data.id + '" data-nr="' + itr + '"><div class="sr-f-top-container">';

      var has_rated = ( false || (parseInt(data.is_rated_h) > 0) || (parseInt(data.is_rated_a) > 0) );

      localStorage.removeItem('m-h-' + data.id);
      localStorage.setItem("m-h-" + data.id, parseInt(data.is_rated_h));
      localStorage.removeItem('m-a-' + data.id);
      localStorage.setItem("m-a-" + data.id, parseInt(data.is_rated_a));

      // Split timestamp into [ Y, M, D, h, m, s ]
      var t = data.started.split(/[- :]/);
      var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];
      var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

      // Apply each element to the Date function
      var nowTime = new Date();

      var jan = new Date(nowTime.getFullYear(), 0, 1);
      var jul = new Date(nowTime.getFullYear(), 6, 1);
      var isdst = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
      isdst = nowTime.getTimezoneOffset() < isdst;

      var datetimeUK = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
      // console.log(t);

      var datetime = new Date(t[0], t[1]-1, t[2], parseInt(t[3]) - (isdst ? 1 : 0) - (nowTime.getTimezoneOffset()/60), t[4], t[5]);
      
      // console.log("=-==-=-=-=-=-=-=-=-=-=");
      // console.log(isdst);
      // console.log(nowTime.getTimezoneOffset());
      // console.log(datetime.getTimezoneOffset());
      // console.log(nowTime.toUTCString());
      // console.log(datetime.toUTCString());
      //var nowTime = new Date(2014, 10, 8, 12, 45, 10);

      var ddif = parseInt((nowTime-datetime)/(60*1000));

      var midGame = false;

      if (ddif >= 0 && ddif <= 120) {
        midGame = true;
      }

      ret += '<div class="sr-home-team"><div class="sr-team-badge sr-team-badge-sel-'+squad_dict[data.host_team_id].slug+' ' + (data.host_team_id == fav_squadid ? '' : 'srt-nf') + '" style="background-image:url(img/' + squad_dict[data.host_team_id].slug + '_big'+(data.host_team_id == fav_squadid ? '' : '_nf')+'.png);"></div><div class="sr-team-details">' + squad_dict[data.host_team_id].short_name  + '<div class="sr-team-form">' + squad_dict[data.host_team_id].team_form + '</div></div></div>';

      dateString = datetime.toString();
      var month = monthNames[datetime.getMonth()];
      var mm = parseInt(datetime.getMonth()) + 1;
      if (mm < 10) {
        mm = "0" + mm;
      }
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
      var year = datetime.getFullYear() + "";
      // year = year.substring(2, 4);
      //dateString += " " + datetime.getFullYear() + " " + hrs + ":" + mins;
      dateString = hrs + ":" + mins;
      // dateString1 = dayNames[parseInt(datetime.getDay())].substring(0,3) + ', ' + datetime.getDate() + " " + monthNames[parseInt(datetime.getMonth())].substring(0,3) + " " + year;
      dateString1 = dayNames[parseInt(datetime.getDay())] + ', ' + datetime.getDate() + " " + monthNames[parseInt(datetime.getMonth())] + " " + year;

      var stadium = squad_dict[data.host_team_id].stadium;
      var tmp = stadium.indexOf("(");
      stadium = stadium.substring(0, tmp);
      stadium = stadium.trim();

      var score = data.score;
      score = score.replace(' - ', ':');
      score = score.replace('-', ':');
      score = score.replace(' V ', 'n');
      score = score.replace(' v ', 'n');
      score = score.replace('V', 'n');
      score = score.replace('v', 'n');
      score = score.replace(':', '</span><span class="sr-score-2">:</span><span class="sr-score-3">');

      var homeScore = 0;
      for (var i=0; i<event_dict.length; ++i) {
        if (event_dict[i].match_id == data.id && 
          ((event_dict[i].team_id == data.host_team_id && event_dict[i].type == 'goal') || 
            (event_dict[i].team_id == data.guest_team_id && event_dict[i].type == 'own-goal')) ) {
          homeScore ++;
        }
      }
      var awayScore = 0;
      for (var i=0; i<event_dict.length; ++i) {
        if (event_dict[i].match_id == data.id && 
          ((event_dict[i].team_id == data.guest_team_id && event_dict[i].type == 'goal') || 
            (event_dict[i].team_id == data.host_team_id && event_dict[i].type == 'own-goal')) ) {
          awayScore ++;
        }
      }

      var score_f = '[ F / T ]';
      var score_s = ' style="padding-top:8px;"';
      var score_h = '';

      if (midGame) {
        score = homeScore+'</span><span class="sr-score-2">:</span><span class="sr-score-3">'+awayScore;
      } else {
        if (score == 'n' || score == '' || score == ' ') {
          if(ddif >= 120) {
            score = homeScore+'</span><span class="sr-score-2">:</span><span class="sr-score-3">'+awayScore;
            score_f = '[ F / T ]';
            /*var dd = parseInt(datetime.getDate());
            if (dd < 10) {
              dd = "0" + dd;
            }
            score_f = '<span class="sr-score-date" style="margin-top: 0px;">' + dd + ' / ' + mm + ' / ' + year.substring(2, 4) + '</span>';*/
          }
        }
      }

      if (midGame) {
        var dd = parseInt(datetime.getDate());
        if (dd < 10) {
          dd = "0" + dd;
        }
        // console.log(dd);
        score_f = '<span class="sr-score-date" style="margin-top: 0px;">' + dd + ' / ' + mm + ' / ' + year.substring(2, 4) + '</span>';
      }

      if (score == 'n' || score == '' || score == ' ') {
        score = '</span><span class="sr-score-time">' + dateString;
        var dd = parseInt(datetime.getDate());
        if (dd < 10) {
          dd = "0" + dd;
        }
        // console.log(dd);
        score_f = '<span class="sr-score-date">' + dd + ' / ' + mm + ' / ' + year.substring(2, 4) + '</span>';
        score_s = '';
        score_h = ' hidden';
      }

      localStorage.removeItem('m-score-' + data.id);
      localStorage.setItem("m-score-" + data.id, score);

      ret += '<div class="sr-middle"><div class="sr-score"><span class="sr-score-1'+score_h+'">' + score + '</span></div></br>' + score_f + '</div>';
      ret += '<div class="sr-away-team"><div class="sr-team-badge sr-team-badge-sel-'+squad_dict[data.guest_team_id].slug+' ' + (data.guest_team_id == fav_squadid ? '' : 'srt-nf') + '" style="background-image:url(img/' + squad_dict[data.guest_team_id].slug + '_big'+(data.guest_team_id == fav_squadid ? '' : '_nf')+'.png);"></div><div class="sr-team-details">' + squad_dict[data.guest_team_id].short_name  + '<div class="sr-team-form">' + squad_dict[data.guest_team_id].team_form + '</div></div></div>'

      ret += '</div>'; //END TOP CONTAINER

      ret += '<div class="sr-f-events-container">';

      // EVENTS
      ret += '<div class="mf-events-wrapper"><div class="mfe-wrap-third"><div class="mf-events mf-events-home">';

      for (var i=0; i<event_dict.length; ++i) {
        if (event_dict[i].match_id == data.id && parseInt(event_dict[i].minute) !== -1 &&
          ((event_dict[i].team_id == data.host_team_id && event_dict[i].type == 'goal') || 
            (event_dict[i].team_id == data.guest_team_id && event_dict[i].type == 'own-goal')) ) {
          ret += '<div class="mf-e-goal">' + event_dict[i].player + '  (' + event_dict[i].minute + '\'' + (event_dict[i].type == 'own-goal' ? ' - OG' : '') + ')</div>';
        } else if (event_dict[i].match_id == data.id && event_dict[i].team_id == data.host_team_id) {
          if (event_dict[i].type != 'goal' && event_dict[i].type != 'own-goal') {
            ret += '<div class="' + event_dict[i].type + '">' + event_dict[i].player + '  (' + event_dict[i].minute + '\')</div>';
          }
        }
      }

      ret += '</div></div><div class="mfe-wrap-third middle"></div><div class="mfe-wrap-third"><div class="mf-events mf-events-away">';
      for (var i=0; i<event_dict.length; ++i) {
        if (event_dict[i].match_id == data.id && parseInt(event_dict[i].minute) !== -1 &&
          ((event_dict[i].team_id == data.guest_team_id && event_dict[i].type == 'goal') || 
            (event_dict[i].team_id == data.host_team_id && event_dict[i].type == 'own-goal')) ) {
          ret += '<div class="mf-e-goal">' + event_dict[i].player + '  (' + event_dict[i].minute + '\'' + (event_dict[i].type == 'own-goal' ? ' - OG' : '') + ')</div>';
        } else if (event_dict[i].match_id == data.id && event_dict[i].team_id == data.guest_team_id) {
          if (event_dict[i].type != 'goal' && event_dict[i].type != 'own-goal') {
            ret += '<div class="' + event_dict[i].type + '">' + event_dict[i].player + '  (' + event_dict[i].minute + '\')</div>';
          }
        }
      }
      ret += '</div></div></div>';
      // END EVENTS


      var has_rated = ( false || (parseInt(data.is_rated_h) > 0) || (parseInt(data.is_rated_a) > 0) );

      localStorage.removeItem('m-h-' + data.id);
      localStorage.setItem("m-h-" + data.id, parseInt(data.is_rated_h));
      localStorage.removeItem('m-a-' + data.id);
      localStorage.setItem("m-a-" + data.id, parseInt(data.is_rated_a));

      if (has_rated) {
        ret += '<div class="long-button btn-bg-'+squad_dict[fav_squadid].slug+' mt-10" data-ajax="false" data-href="my_rating.html?match=' + data.id + '&team=true"><div class="ss-star ss-left '+(parseInt(data.is_rated_h) > 0 ? ' ss-white ' : '')+' "></div>STARATINGS<div class="ss-star ss-right '+(parseInt(data.is_rated_a) > 0 ? ' ss-white ' : '')+' "></div></div>';
      } else if ((parseInt(day) > parseInt(nowMatchDay)) || (parseInt(day) == parseInt(nowMatchDay) && ddif < 0) ) {
        ret += '<div class="long-button btn-bg-'+squad_dict[fav_squadid].slug+' mt-10 inactive" data-ajax="false" data-href="javascript:void(0);">STARATINGS</div>';
      } else {
        ret += '<div class="long-button btn-bg-'+squad_dict[fav_squadid].slug+' mt-10" data-ajax="false" data-href="player_rating.html?match=' + data.id + '&team=true"><div class="ss-star ss-left '+(parseInt(data.is_rated_h) > 0 ? ' ss-white ' : '')+' "></div>STARATINGS<div class="ss-star ss-right '+(parseInt(data.is_rated_a) > 0 ? ' ss-white ' : '')+' "></div></div>';
      }

      ret += '<div class="sr-match-details">&bull;&nbsp;&nbsp;' + stadium.toUpperCase() + '&nbsp;&nbsp;&bull;&nbsp;&nbsp;' + dateString1.toUpperCase() + '&nbsp;&nbsp;&bull;&nbsp;&nbsp;KICK OFF : ' + dateString.replace(':', '.') + '&nbsp;&nbsp;&bull;';

      ret += '</div>';
      ret += '</div>';
      ret += '</div>';

      return ret;
    }
  };

  return matchDayController;

});
