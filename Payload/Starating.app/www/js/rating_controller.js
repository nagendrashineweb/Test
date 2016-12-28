define(['jquery', 'user', 'parsley', 'rest', 'player_database', 'squad_database', 'match_database', 'events_database', 'socialsharing', 'general'], function ($, user, parsley, rest, player_db, squad_db, match_db, event_db, socialsharing, general) {

  var rateIndexer, ratePreviousIndexer, userId, squadId, home_away_Player_dict;
  var player_dict;
  var squad_dict;
  var event_dict;
  var ratings_dict = [];
  var matchid, match;
  var squad1, squad2;
  var globalRatings_dict = [];
  var myRatingsArray = {};
  var scroll = 26;
  var doScroll = false;
  var rated_team1 = false;
  var competition_id = 'PM';
  var ts = [];
  var bs = [];
  var startedRatingOp = false;
  var finishedRatingOp = false;
  var pulledGR = false;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var haveRated = false;
  var wasShown = false;
  var userObj;
  var dragendObj;
  var setPrevPage;
  var dragendPage;
  var onboard;

  var rating_controller = {

    initRating: function(mid, dobj, setpp, onb){

      dragendObj = dobj;
      setPrevPage = setpp;
      dragendPage = 1;
      onboard = onb;

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

      matchid = parseInt(mid);

      //TODO
      $('.rating-options').html("");
      for(var i = 0; i < 10; i++){
          var raterc = $('<div/>', {
              class: 'rating-button-wr'
          });
          var rater = $('<div/>', {
              id: 'ratingb-' + i + 1,
              class: 'rating-button',
              text: i + 1
          });
          raterc.append(rater);
          $('.rating-options').append(raterc);
      }

      userObj = user.getUser();
      fav_squadid = parseInt(userObj.team_id);

      match_db.getData(function(data){
        match_dict = data;
        match = match_dict[matchid];

        rating_controller.setSquadIDs(match);
        squadId = squad1;

        $cr = $("#swipe-content li").eq(0);
        $cr.find('.content').addClass('content-'+squad1);
        $cr = $("#swipe-content li").eq(1);
        $cr.find('.content').addClass('content-'+squad2);

        if (onboard) {
          $('.inner-content .inner-content').eq(0).addClass('content-'+squad1);
          $('.inner-content .inner-content').eq(1).addClass('content-'+squad2);
        }

        rating_controller.pullGlobalRatings();

        player_db.getData(function(data){
          player_dict = data;

          squad_db.getData(function(data){
            squad_dict = data;

            $('.match-cont').html(rating_controller.createMatchDayElements(match));
            $('.medium-button').addClass('btn-bg-' + squad_dict[fav_squadid].slug);

            // $('.bottom-nav a').off(clickEvent);
            $('.bottom-nav a').off();
            $('.bottom-nav a').on(clickEvent, function(e) {
              e.preventDefault();
              if (haveRated) {
                // e.preventDefault();
                var alert_message = 'You’ll lose all your ratings if you leave this screen right now.';
                var _this = $(this);
                function onConfirm(btn) {
                  if (btn == 1) {
                    window.location.href = _this.attr('href');
                  }
                }
                if (navigator.notification) {
                  console.log('creating notif');
                  navigator.notification.confirm(
                    alert_message,  // message
                    onConfirm,         // callback
                    'Don\'t go just yet!',            // title
                    ['GO ANYWAY', 'STAY']                  // buttonName
                  );
                } else {
                  var conf = confirm(alert_message);
                  if (conf == true) {
                    onConfirm(1);
                  }
                }
              } else {
                window.location.href = $(this).attr('href');
              }
            });

            $('body').on(clickEvent, '.header-back', function(e) {
              e.preventDefault();
              if (haveRated) {
                // e.preventDefault();
                var alert_message = 'You’ll lose all your ratings if you leave this screen right now.';
                var _this = $(this);
                function onConfirm(btn) {
                  if (btn == 1) {
                    if (onboard) {
                      window.location.href = "onboard1.html";
                    } else {
                      window.location.href = "dashboard.html?md=" + rating_controller.getMatchDayOfMatch();
                    }
                  }
                }
                if (navigator.notification) {
                  console.log('creating notif');
                  navigator.notification.confirm(
                    alert_message,  // message
                    onConfirm,         // callback
                    'Don\'t go just yet!',            // title
                    ['GO ANYWAY', 'STAY']                  // buttonName
                  );
                } else {
                  var conf = confirm(alert_message);
                  if (conf == true) {
                    onConfirm(1);
                  }
                }
              } else {
                if (onboard) {
                  window.location.href = "onboard1.html";
                } else {
                  window.location.href = "dashboard.html?md=" + rating_controller.getMatchDayOfMatch();
                }
              }
            });

            if (fav_squadid == parseInt(squad2)) {
              rating_controller.setSquad(1);
              dragendObj.jumpToPage(2);
              setPrevPage(1);
              dragendPage = 2;
            }

            $('.info-box-dd .ib-dd-top').off(clickEvent);
            $(document).on(clickEvent, '.info-box-dd .ib-dd-top', function(){
              $('.info-box-dd .ib-dd-top').each(function() {
                var alreadyActive = false;
                $arr = $(this).find('.arrow-up');
                $el = $(this).parent().find('.ib-dd-content');
                if ($el.hasClass('active')) {
                  alreadyActive = true;
                }

                if (!alreadyActive) {
                  $el.addClass('active');
                  $el.slideToggle();
                  $cont = $(this).parent().parent();
                  $cont.find('.prating-swipe').animate({top: 332});
                  $arr.addClass('open');
                  if ($cont.find('.player-rate-ready').length == 0) {
                    $pel = $cont.find('#players-container .player-rate').first();
                    $pel.addClass('player-rate-ready');
                    rateIndexer = $pel.attr('id');
                  }
                } else {
                  $el.removeClass('active');
                  $el.slideToggle();
                  $(this).parent().parent().find('.prating-swipe').animate({top: 205});
                  $arr.removeClass('open');
                }
              });
              
            });

            //TODO jumpPage
            $('.content-'+squad1+' .sb-center').text(squad_dict[squad1].name);
            $('.content-'+squad2+' .sb-center').text(squad_dict[squad2].name);
            
            $('.content-'+squad1+' .sb-right').html('<span class="sb-r-m">'+squad_dict[squad2].name + '</span>');
            mrgr = ($('.content-'+squad1+' .sb-r-m').width() / 2);
            $('.content-'+squad1+' .sb-r-m').css('margin-right', "-" + mrgr + 'px');

            $('.content-'+squad2+' .sb-left').html('<span class="sb-l-m">'+squad_dict[squad1].name + '</span>');
            mrgl = ($('.content-'+squad2+' .sb-l-m').width() / 2);
            $('.content-'+squad2+' .sb-l-m').css('margin-left', "-" + mrgl + 'px');
            

            $('.rating-button').off();
            $('.rating-button').unbind(clickEvent);
            $('.submit-rating-button').unbind(clickEvent);

            var intervalCheck = setInterval(function() {runPopulate()}, 100);

            var runPopulate = function() {
              if (pulledGR) {
                rating_controller.getMembersToRate(squad1);
                rating_controller.getMembersToRate(squad2);
                clearInterval(intervalCheck);
              }
            }
          });
        });
      });
    },

    jumpPage: function(pg) {
      rating_controller.setSquad(pg);
      // dragendObj.jumpToPage(pg);
      setPrevPage(pg);
      dragendPage = pg+1;
    },

    createMatchDayElements:function(data){

      var ret = '<div class="sr-fixture sr-fixture-' + data.id + '" data-match-id="' + data.id + '"><div class="sr-f-top-container">';

      // Split timestamp into [ Y, M, D, h, m, s ]
      var t = data.started.split(/[- :]/);
      var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];
      var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

      // Apply each element to the Date function
      var datetime = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
      var nowTime = new Date();
      //var nowTime = new Date(2014, 10, 8, 12, 45, 10);

      var ddif = parseInt((nowTime-datetime)/(60*1000));

      var midGame = false;

      if (ddif >= 0 && ddif <= 120) {
        midGame = true;
      }
      ret += '<a class="sr-home-team"><div class="sr-team-badge sr-team-badge-sel-'+squad_dict[data.host_team_id].slug+' ' + (data.host_team_id == fav_squadid ? '' : 'srt-nf') + '" style="background-image:url(img/' + squad_dict[data.host_team_id].slug + '_big'+(data.host_team_id == fav_squadid ? '' : '_nf')+'.png);"></div><div class="sr-team-details">' + squad_dict[data.host_team_id].short_name  + '<div class="sr-team-form">' + squad_dict[data.host_team_id].team_form + '</div></div></a>';

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
      dateString1 = dayNames[parseInt(datetime.getDay())].substring(0,3) + ', ' + datetime.getDate() + " " + monthNames[parseInt(datetime.getMonth())].substring(0,3) + " " + year;

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
      var awayScore = 0;
      if (midGame) {
        score = homeScore+'</span><span class="sr-score-2">:</span><span class="sr-score-3">'+awayScore;
      } else {
        if (score == 'n' || score == '' || score == ' ') {
          if(ddif >= 120) {
            score = homeScore+'</span><span class="sr-score-2">:</span><span class="sr-score-3">'+awayScore;
          }
        }
      }

      var score_f = '[ F / T ]';
      var score_s = ' style="padding-top:8px;"';
      var score_h = '';

      if (score == 'n' || score == '' || score == ' ') {
        score = '</span><span class="sr-score-time">' + dateString;
        var dd = parseInt(datetime.getDate());
        if (dd < 10) {
          dd = "0" + dd;
        }
        score_f = '<span class="sr-score-date">' + dd + ' / ' + mm + ' / ' + year.substring(2, 4) + '</span>';
        score_s = '';
        score_h = ' hidden';
      }

      if (localStorage.getItem('m-score-' + data.id)) {
        score = localStorage.getItem('m-score-' + data.id);  
      }

      ret += '<div class="sr-middle"><div class="sr-score"><span class="sr-score-1'+score_h+'">' + score + '</span></div></br>' + score_f + '</div>';
      ret += '<a class="sr-away-team"><div class="sr-team-badge sr-team-badge-sel-'+squad_dict[data.guest_team_id].slug+' ' + (data.guest_team_id == fav_squadid ? '' : 'srt-nf') + '" style="background-image:url(img/' + squad_dict[data.guest_team_id].slug + '_big'+(data.guest_team_id == fav_squadid ? '' : '_nf')+'.png);"></div><div class="sr-team-details">' + squad_dict[data.guest_team_id].short_name  + '<div class="sr-team-form">' + squad_dict[data.guest_team_id].team_form + '</div></div></a>';

      ret += '</div>'; //END TOP CONTAINER
      ret += '</div>';
      return ret;
    },

    getMatchDayOfMatch: function() {
      return match.matchDay;
    },

    setSquadIDs: function(match) {
      squad1 = match.host_team_id;
      squad2 = match.guest_team_id;
    },

    getSquad: function() {
      return squadId;
    },

    setSquad: function(tab) {
      if (tab == 0) {
        squadId = squad1;
      } else {
        squadId = squad2;
      }
    },

    getMembersToRate: function(sq){
      var rated_h = parseInt(window.localStorage.getItem('m-h-' + matchid));
      var rated_a = parseInt(window.localStorage.getItem('m-a-' + matchid));

      var baseClass = ".content-" + sq;

      $(baseClass+' #players-container').html("");
      if ((rated_h == 1 && squadId == squad1) || (rated_a == 1 && squadId == squad2) ) {
        $(baseClass+' #players-container').html("<span style='padding: 10px; font-size: 22px; text-align: center; display: block; width: calc(100% - 20px);'>You have already submitted your ratings for this match!</span>");
        general.hideLoader();
        $('.info-box-dd').hide();
        $('.inner-content').fadeIn();
        $('.submit-rating-button').hide();
        return;
      } else {
        $('.submit-rating-button').show();
      }

      setTimeout(function() { if ($('.spinner-overlay').data('display') == "0") $('.spinner-text').show();}, 4000);

      rest.get('lineup/' + matchid + '/' + sq,'').done(function(data){
        $(baseClass+' #players-container').html("");
        $(baseClass+' .next-rating-button').hide();
        if (data.length == 0) {
          $(baseClass+' #players-container').html("<span style='padding: 10px; font-size: 22px; text-align: center; display: block; width: calc(100% - 20px);'>No lineups available yet, please come back later!</span>");
          $(baseClass+' .submit-rating-button').hide();
        } else {
          if (rated_team1) {
            $(baseClass+' .submit-rating-button').show();
            if (startedRatingOp && !finishedRatingOp) {
              $(baseClass+' .next-rating-button').show();
            }
          } else {
            $(baseClass+' .submit-rating-button').show();
            if (!finishedRatingOp) {
              $(baseClass+' .next-rating-button').show();
            }
          }
        }

        var index_active = 0;
        if (!$('.ib-dd-content').is(':visible')) {
          index_active = -1;
        }

        $(data).each(function(index, obj){
          obj.id = parseInt(obj.id);

          if (!(obj.id in globalRatings_dict)) {
            globalRatings_dict[obj.id] = { rating: 0 };
          }
          if (index == 0) {
            index_active = 0;
            if (!$('.ib-dd-content').is(':visible')) {
              index_active = -1;
            }
          }
          var x = "" + obj.id;
          var already_rated = false;
          if (myRatingsArray[x] && myRatingsArray[x] !== null) {
            already_rated = true;
          }
          if (index_active == index && (already_rated || (parseInt(obj.has_played) == 0)) ) {
            index_active = parseInt(index) + 1;
          }

          var pcont = '<div class="np-rate-width '+ (obj.rating == 0 ? 'hidden' : '') +'" style="width:' + (Math.round(parseFloat(obj.rating) * 10)/10.0).toFixed(1)*10 + '%"></div>';
          pcont += '<div class="arrow-right"></div><div class="re-shirt">' + obj.shirt_number + '</div><h1 class="re-player">' + obj.name + '</h1>';
          pcont += '<div class="re-goals '+(obj.goals == 0 ? 'hidden' : '')+'">'+(obj.goals > 1 ? obj.goals : '')+'</div>';
          pcont += '<div class="re-cards-yellow '+((obj.ycards == 0 || obj.ycards > 1) || obj.rcards > 0 ? 'hidden' : '')+'"></div>';
          pcont += '<div class="re-cards-yr '+(obj.ycards < 2 ? 'hidden' : '')+'"></div>';
          pcont += '<div class="re-cards-red '+(obj.rcards == 0 ? 'hidden' : '')+'"></div>';
          pcont += '<h1 class="re-rating-match '+ (obj.is_gold === true ? 'gold' : '') + ' '+ (obj.rating == 0 ? 'hidden' : '') +'">' + (Math.round(parseFloat(obj.rating) * 10)/10.0).toFixed(1) + /*data.rating  +*/ '</h1><p class="score">' + (already_rated ? myRatingsArray[x].rating : '&ndash;') + '</p>';
          if(index == index_active){
            rateIndexer = 'rating-' + obj.id;

            var player = $('<div/>', {
                id: 'rating-' + obj.id,
                class: 'player-rate-ready rateable rating-player ' + (parseInt(obj.has_played) == 1 ? (already_rated == false ? 'not-rated' : '') : 'not-rateable'),
                html: pcont,
                'data-member': obj.id,
                'data-team': obj.team_id,
                'data-pos': index,
                'data-has_played': obj.has_played,
                'data-is_sub': obj.is_sub,
                'data-sub_on_min': obj.sub_on_min,
                'data-sub_off_min': obj.sub_off_min
            });
          } else {
            var player = $('<div/>', {
                id: 'rating-' + obj.id,
                class: 'player-rate rateable rating-player ' + (parseInt(obj.has_played) == 1 ? (already_rated == false ? 'not-rated' : '') : 'not-rateable'),
                html: pcont,
                'data-member': obj.id,
                'data-team': obj.team_id,
                'data-pos': index,
                'data-has_played': obj.has_played,
                'data-is_sub': obj.is_sub,
                'data-sub_on_min': obj.sub_on_min,
                'data-sub_off_min': obj.sub_off_min
            });
          }
          $(baseClass+' #players-container').append(player);

        });

        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        general.hideLoader();
        if (onboard) {
          $('.onb-content').fadeIn();
          // $(baseClass+'.inner-content.ui-page-active').fadeIn();
        } else {
          $('.inner-content').fadeIn();
        }

        if (index_active > 0) {
          var elm = $(baseClass+' #players-container').find('.not-rated').first();
          if (elm.length) {
            var sc = parseInt(elm.data('pos')) - 1;
            sc *= 56;
            if (sc < 0) {
              sc = 0;
            }
            // sc += 26;
            sc += 0;
            $(baseClass+' #player-scrolling-container').scrollTop(sc);
          }
        }

        $(baseClass+' .rating-button').off();
        $(baseClass+' .rating-button').on(clickEvent, function(e){
          // console.log(squadId);
          baseClass = '.content-' + squadId;
          haveRated = true;
          $('.rating-button').removeClass('active');
          $(this).addClass('active');

          if (!$(baseClass+' #'+ rateIndexer).hasClass('player-rate-ready')) {
            var elmtmp = $(baseClass+' #players-container').find('.not-rated').first().addClass('player-rate-ready');
            rateIndexer = elmtmp.attr('id');
          }

          if ($(baseClass+' #'+ rateIndexer).hasClass('player-rate-ready')) {
            // console.log('hasClass');
            // console.log(rateIndexer);
            var playerToRate = $(baseClass+' #players-container').find('.player-rate-ready').first();
            var el = {
              member_id:playerToRate.data('member'),
              squad_id:playerToRate.data('team'),
              rating:$('.rating-button.active').text(),
              match_id:matchid,
              has_played:playerToRate.data('has_played'),
              is_sub:playerToRate.data('is_sub'),
              sub_on_min:playerToRate.data('sub_on_min'),
              sub_off_min:playerToRate.data('sub_off_min')
            };
            var x = "" + playerToRate.data('member');
            myRatingsArray[x] = el;
            
            playerToRate.children().remove('.score');
            playerToRate.append('<p class="score">'+ $(baseClass+' .rating-button.active').text() +'</p>');
            playerToRate.removeClass('not-rated');

            $('#'+ rateIndexer).removeClass('player-rate-ready');
            if ($(baseClass+' .player-rate-ready').length > 0) {
              $(baseClass+' .player-rate-ready').removeClass('player-rate-ready');
            }
            var elm = $(baseClass+' #players-container').find('.not-rated').first().addClass('player-rate-ready');
            rateIndexer = elm.attr('id');
            if (elm.length) {
              // console.log('el found');
              if (doScroll) {
                scroll += 56;
              } else {
                doScroll = true;
              }
              var sc = parseInt(elm.data('pos')) - 1;
              sc *= 56;
              if (sc < 0) {
                sc = 0;
              }
              //sc += 26;
              sc += 0;
              // console.log(sc);
              $(baseClass+' #player-scrolling-container').animate({ scrollTop: sc });
            } else {
              $(baseClass+' #player-scrolling-container').animate({ scrollTop: $(baseClass+' #player-scrolling-container').prop("scrollHeight") });
            }
          }

          if ($(baseClass+' .rating-player.not-rated').length > 0) {
            $(baseClass+' .next-rating-button').addClass('inactive');
          } else {
            $(baseClass+' .next-rating-button').removeClass('inactive');
          }

        });

        $(baseClass+' .next-rating-button').on(clickEvent, function(e){
          if ($(this).hasClass('inactive')) {
            var alert_message = 'Please rate the full line up before you move on to their opponents.';
            if (navigator.notification) {
              navigator.notification.alert(
                alert_message,  // message
                null,         // callback
                'Slow down!',            // title
                'GOT IT'                  // buttonName
              );
            } else {
              alert(alert_message);
            }
            return;
          }
          if (onboard) {
            $('.next-rating-button').hide();
            $('.submit-rating-button').removeClass('medium-text-button').addClass('medium-button').html('Submit now');;
          }
          var tab = rating_controller.getSquad();
          if (tab == squad1) {
            tab = 1;
          } else {
            tab = 0;
          }

          if ($(baseClass+' .rating-player.not-rated').length == 0) {
            $('.next-rating-button').hide();
            $('.submit-rating-button').removeClass('medium-text-button').addClass('medium-button').addClass('btn-bg-' + squad_dict[fav_squadid].slug).html('Submit now');
            $(this).show();
            //TODO jumptopage
            rated_team1 = true;
            // $('.content').trigger('swipeleft');
            if (dragendPage == 2) {
              dragendPage = 1;
            } else {
              dragendPage = 2;
            }
            dragendObj.jumpToPage(dragendPage);
            rating_controller.setSquad(dragendPage-1);
            setPrevPage(dragendPage-1);

            if ($('.content-' + squadId).find('.player-rate-ready').length == 0) {
              $pel = $('.content-' + squadId).find('#players-container .player-rate').first();
              $pel.addClass('player-rate-ready');
              rateIndexer = $pel.attr('id');
            }
          } else {
            var alert_message = 'Please rate the full line up before you move on to their opponents.';
            if (navigator.notification) {
              navigator.notification.alert(
                alert_message,  // message
                null,         // callback
                'Slow down!',            // title
                'GOT IT'                  // buttonName
              );
            } else {
              alert(alert_message);
            }
          }

          
        });

        $(baseClass+' .submit-rating-button').on(clickEvent, function(e){
          doSubmit = false;
          if (startedRatingOp && finishedRatingOp) {
            doSubmit = true;
          }
          if (!startedRatingOp) {
            doSubmit = true;
          }

          if ($(baseClass+' .rating-player.not-rated').length == 0 && doSubmit) {
            var userid = userObj.id;
            rating_controller.submitAllRatings(userid, myRatingsArray);
          } else {
            if (navigator.notification) {
              navigator.notification.alert(
                'You can’t submit your scores until you’ve rated the full line up.',  // message
                null,         // callback
                'Not so fast!',            // title
                'GOT IT'                  // buttonName
              );
            } else {
              alert('Please rate all players before submitting!');
            }
          }
        });

        $(baseClass+' .rateable').on(clickEvent, function(e){
          $('#'+ rateIndexer).removeClass('player-rate-ready');
          if ($(baseClass+' .player-rate-ready').length > 0) {
            $(baseClass+' .player-rate-ready').removeClass('player-rate-ready');
          }
          $(this).addClass('player-rate-ready');
          rateIndexer = $(this).attr('id');

          if (!$('.ib-dd-content').is(':visible')) {
            $arr = $('.info-box-dd .ib-dd-top').find('.arrow-up');
            $el = $('.info-box-dd .ib-dd-top').parent().find('.ib-dd-content');
            $el.addClass('active');
            $el.slideToggle();
            //TODO check this
            $('.prating-swipe').animate({top: 332});
            $arr.addClass('open');
          }

          var elm = $(this);
          var sc = parseInt(elm.data('pos')) - 1;
          sc *= 56;
          if (sc < 0) {
            sc = 0;
          }
          // sc += 26;
          sc += 0;
          if (parseInt(elm.data('pos')) == 0) {
            sc = 0;
          }
          $(baseClass+' #player-scrolling-container').animate({ scrollTop: sc });
        });
      });
    },

    submitAllRatings:function(userid, data){
      userid = userObj.id;
      // console.log(data);
      postval = {ratings : data};

      rest.post('bulk-rate/' + userid, postval).done(function(e){

        if (onboard) {
          window.location.href = "onboard3.html?match=" + match.id;
        } else {
          window.location.href = "my_rating.html?match=" + match.id;
        }
        
        return;
        
      });
    },

    pullGlobalRatings:function(){
      var myRatings = rest.get('squad/getGlobalTeams/' + squad1 + '/' + squad2).done(function(data){
        $.each(data, function(index, r){
          globalRatings_dict[r.member_id] = r;
        });
        pulledGR = true;
      });
    }
  };

  return rating_controller;

});
