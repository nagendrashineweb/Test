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
var onboard;
var matchScore;
var matchDate;
var matchKickOff;
var matchStadium;
var matchDuring;
var squadColours = {'arsenal': '#931127', 'aston-villa': '#4c012a', 
    'burnley': '#3f042e', 'chelsea': '#011756', 
    'crystal-palace': '#59002b', 'everton': '#0d1468',
    'hull-city': '#bf672c', 'leicester-city': '#02335e',
    'liverpool': '#8c0229', 'manchester-city': '#4090c1',
    'manchester-united': '#7c0018', 'newcastle-united': '#000000',
    'queens-park-rangers': '#024493', 'southampton': '#911c35',
    'stoke-city': '#910220', 'sunderland': '#91071f',
    'swansea-city': '#a0a0a0', 'tottenham-hotspur': '#000023',
    'west-bromwich-albion': '#000023', 'west-ham-united': '#3d142c'}

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
            console.log('x: ' + x);
            console.log('y: ' + y);

            $self.one('touchend', function(endEvent) {
              console.log(endCoords);
              if (target == endEvent.target && Math.abs(endCoords.pageY - y) < 20 && Math.abs(endCoords.pageX - x) < 20) {
                endEvent.preventDefault();
                $.event.simulate('tap2', self, endEvent);
              }
            });
          });
        }
      };

      $('body').on(clickEvent, '.header-back', function(e) {
        if (onboard) {
          window.location.href = "onboard2.html?match=" + mid;
        } else {
          window.location.href = "dashboard.html?md=" + rating_controller.getMatchDayOfMatch();
        }
      });

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

        rating_controller.pullGlobalRatings();

        player_db.getData(function(data){
          player_dict = data;

          squad_db.getData(function(data){
            squad_dict = data;

            $('.match-cont').html(rating_controller.createMatchDayElements(match));
            $('.medium-button').addClass('btn-bg-' + squad_dict[fav_squadid].slug);

            if (fav_squadid == parseInt(squad2)) {
              rating_controller.setSquad(1);
              dragendObj.jumpToPage(2);
              setPrevPage(1);
              dragendPage = 2;
            }

            $('.info-box-dd .ib-dd-top').off(clickEvent);
            $(document).on(clickEvent, '.info-box-dd .ib-dd-top', function(){
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
              // console.log("checking populate");
              if (pulledGR) {
                // console.log('removed');
                rating_controller.pullRatingData(squad1);
                rating_controller.pullRatingData(squad2);
                // rating_controller.getMembersToRate(squad1);
                // rating_controller.getMembersToRate(squad2);
                clearInterval(intervalCheck);
              }
            }
          });
        });
      });
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
      matchDate = dayNames[parseInt(datetime.getDay())] + ', ' + datetime.getDate() + " " + monthNames[parseInt(datetime.getMonth())] + " " + year;
      matchKickOff = dateString;

      var stadium = squad_dict[data.host_team_id].stadium;
      var tmp = stadium.indexOf("(");
      stadium = stadium.substring(0, tmp);
      stadium = stadium.trim();

      matchStadium = stadium;

      var score = data.score;
      score = score.replace(' - ', ':');
      score = score.replace('-', ':');
      score = score.replace(' V ', 'n');
      score = score.replace(' v ', 'n');
      score = score.replace('V', 'n');
      score = score.replace('v', 'n');
      matchScore = score;
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
        if (matchScore == 'n' || matchScore == " n ") {
          matchScore = score;
          matchScore = matchScore.replace('</span><span class="sr-score-2">:</span><span class="sr-score-3">', ':');
        }
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

    pullRatingData:function(sq){
      var myRatings = rest.get('myratings2/'+ userObj.id + '/' + matchid,'').done(function(data){
        var baseClass = '.content-' + sq;
        $(baseClass+' #my-rating-container').html("");
        var data2 = [];
        var data3 = [];

        var midGame = false;

        var t = match.started.split(/[- :]/);
        // Apply each element to the Date function
        var datetime = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
        var nowTime = new Date();
        //var nowTime = new Date(2014, 10, 8, 12, 45, 10);

        var ddif = parseInt((nowTime-datetime)/(60*1000));

        if (ddif >= 0 && ddif <= 120) {
          midGame = true;
        }

        matchDuring = midGame;

        if (midGame) {
          if (navigator.notification) {
            navigator.notification.alert(
              'This match has not finished yet, you will be able to share your ratings after the match finishes',  // message
              null,         // callback
              ' ',            // title
              'OK'                  // buttonName
            );
          } else {
            alert('This match has not finished yet, you will be able to share your ratings after the match finishes');
          }
          $(baseClass+' .share-button-mr').addClass('inactive');

        }

        for (var index in data) {
          if (parseInt(data[index].squad_id) == parseInt(sq)) {
            data2.push(data[index]);
          } else if (parseInt(data[index].squad_id) == (parseInt(sq) == parseInt(squad1) ? parseInt(squad2) : parseInt(squad1) ) ) {
            data3.push(data[index]);
          }
        }

        // console.log(data2);
        // console.log(data2.length);

        if (data2.length <= 0) {
          $(baseClass+' #my-rating-container').html("<span style='padding: 10px; font-size: 22px; text-align: center; display: block; width: calc(100% - 20px);'>You didn't rate this team</span>"); // Have your say, swipe left and rate them!
          $(baseClass+' #share-buttons').hide();
          $(baseClass+' .info-box-dd').hide();
        } else {
          $(baseClass+' #share-buttons').show();
          $(baseClass+' .info-box-dd').show();
        }

        var rated1 = 1;
        var rated2 = 1;

        if (data2.length <= 0) {
          rated1 = 0;
        }

        if (data3.length <= 0) {
          rated2 = 0;
        }

        for (var index in data) {
          if (parseInt(data[index].team_id) == parseInt(sq)) {
            data2.push(data[index]);
          } else if (parseInt(data[index].team_id) == (parseInt(sq) == parseInt(squad1) ? parseInt(squad2) : parseInt(squad1) ) ) {
            data3.push(data[index]);
          }
        }

        // console.log(data2);


        if (rated1) {
          $.each(data2, function(index, obj){
            var aRatingElement = $('<a/>', {
                id: '',
                class: 'rating-player ' + (parseInt(obj.has_played) == 1 ? '' : 'not-rateable'),
                href: 'player_stats.html?player='+obj.member_id
            });
            aRatingElement.attr('data-ajax', 'false');
            var pcont = '<div class="np-rate-width '+ (obj.match_rating == 0 ? 'hidden' : '') +'" style="width:' + (Math.round(parseFloat(obj.match_rating) * 10)/10.0).toFixed(1)*10 + '%"></div>';
            pcont += '<div class="arrow-right"></div><div class="re-shirt">' + player_dict[obj.member_id].shirt_number + '</div><h1 class="re-player">' + player_dict[obj.member_id].name + '</h1>';
            pcont += '<div class="re-goals '+(obj.goals == 0 ? 'hidden' : '')+'">'+(obj.goals > 1 ? obj.goals : '')+'</div>';
            pcont += '<div class="re-cards-yellow '+((obj.ycards == 0 || obj.ycards > 1) || obj.rcards > 0 ? 'hidden' : '')+'"></div>';
            pcont += '<div class="re-cards-yr '+(obj.ycards < 2 ? 'hidden' : '')+'"></div>';
            pcont += '<div class="re-cards-red '+(obj.rcards == 0 ? 'hidden' : '')+'"></div>';
            pcont += '<h1 class="re-rating-match '+ (obj.is_gold === true ? 'gold' : '') + ' ' + (obj.match_rating == 0 ? 'hidden' : '') +'">' + (Math.round(parseFloat(obj.match_rating) * 10)/10.0).toFixed(1) + /*data.rating  +*/ '</h1><p class="score '+(obj.rating ? '' : 'hidden')+'">' + obj.rating + '</p>';
            aRatingElement.append(pcont);
            // console.log('append with squad: ' + obj.team_id + ' :' + obj.squad_id + ' :' + sq);
            if (obj.is_sub == 0) {
              $(baseClass+' #my-rating-container').append(aRatingElement);
            } else {
              // console.log(obj);
              if (obj.has_played == 1) {
                $(baseClass+' #my-rating-container-subs').append(aRatingElement);
              } else {
                $(baseClass+' #my-rating-container-unused-subs').append(aRatingElement);
              }
            }
            

          });
        }
        

        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        general.hideLoader();
        $('.inner-content').fadeIn();

        $(baseClass+' .share-button-mr').off(clickEvent);

        $(baseClass+' .share-button-mr').on(clickEvent, function() {

          /*if (navigator.notification) {
            navigator.notification.alert(
              'This part of the app is currently being redone',  // message
              null,         // callback
              ' ',            // title
              'OK'                  // buttonName
            );
          } else {
            alert('This part of the app is currently being redone');
          }
          return;*/

          if (midGame) {
            if (navigator.notification) {
              navigator.notification.alert(
                'This match has not finished yet, you will be able to share your ratings after the match finishes',  // message
                null,         // callback
                ' ',            // title
                'OK'                  // buttonName
              );
            } else {
              alert('This match has not finished yet, you will be able to share your ratings after the match finishes');
            }
            return;
          }

          // if (fav_squadid == sq) {
            // rating_controller.processShareGraphic(data2, data3, rated1, rated2, baseClass);
          // } else if (fav_squadid == squad1 || fav_squadid == squad2) {
            // rating_controller.processShareGraphic(data3, data2, rated2, rated1, baseClass);
          // } else {
            if (sq == squad1) {
              rating_controller.processShareGraphic(data2, data3, rated1, rated2, baseClass);
            } else {
              rating_controller.processShareGraphic(data3, data2, rated2, rated1, baseClass);
            }
          // }
          
        });
      });
    },

    hexToRgb: function(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
    },

    processShareGraphic: function(data2, data3, rated1, rated2, baseClass) {
      canvas = $(baseClass+' #share-canvas')[0];

      home_team = squad1;
      if (fav_squadid == squad2) {
        home_team = squad2;
      }

      // console.log(data2);
      // console.log(data3);

      var sq1Rating = 0;
      var sq1c = 0;
      var sq2Rating = 0;
      var sq2c = 0;

      var fw = 1760;

      canvas.width = fw;
      canvas.style.width = fw+"px";
      canvas.height = 880;
      canvas.style.height = "880px";

      var ctx = canvas.getContext("2d");

      sbg = new Image();
      shl = new Image();
      small_star = new Image();
      large_star = new Image();
      goal_icon = new Image();
      red_card_icon = new Image();
      yellow_card_icon = new Image();
      yellow_red_card_icon = new Image();

      sbg.onload = function(){

      shl.onload = function(){

      small_star.onload = function(){

      large_star.onload = function(){

      goal_icon.onload = function(){

      red_card_icon.onload = function(){

      yellow_card_icon.onload = function(){

      yellow_red_card_icon.onload = function(){


        //START DRAW
        //ctx.drawImage(sbg, 0, 0, fw, 880);

        ctx.fillStyle = "#E2E0E0";
        rating_controller.roundRect(ctx, 0, 0, fw, 20, 0, true, false, false);

        ctx.fillStyle = "#E2E0E0";
        rating_controller.roundRect(ctx, 0, 860, fw, 20, 0, true, false, false);

        ctx.fillStyle = "#191B22";
        rating_controller.roundRect(ctx, 0, 20, fw, 220, 0, true, false, false);

        ctx.fillStyle = squadColours[squad_dict[home_team].slug];
        rating_controller.roundRect(ctx, 0, 240, fw, 16, 0, true, false, false);

        //font
        var fontfile = "Proxima-Nova";

        //SHARE GRAPHIC LOGO
        ctx.drawImage(shl, 1582, 74, 62, 62);

        // TOP RIGHT TEXT
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 26px '+fontfile;
        ctx.fillText('DON\'T GO UNHEARD', 1546, 80);
        ctx.fillStyle = '#E32D2D';
        ctx.fillText('STARATING.NET', 1546, 110);

        //TOP LEFT TEXT
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 70px '+fontfile;
        tempMatchScore = matchScore.replace(':', ' - ');
        ctx.fillText(squad_dict[squad1].short_name.toUpperCase() + ' ' + tempMatchScore + ' ' + squad_dict[squad2].short_name.toUpperCase(), 124, 76);
        ctx.font = '200 21px '+fontfile;
        tempMatchDetails = 'Matchday ' + match.matchDay;
        tempMatchDetails = tempMatchDetails.toUpperCase();
        tempMatchDetails2 = matchStadium.toUpperCase();
        tempMatchDetails3 = matchDate.toUpperCase();
        tempMatchDetails4 = 'KICK OFF ' + matchKickOff.replace(':', '.');
        mdx = 124;
        mdy = 162;
        ctx.fillText(tempMatchDetails, mdx, mdy);

        mdx += ctx.measureText(tempMatchDetails).width;
        ctx.font = '400 21px '+fontfile;
        ctx.fillStyle = '#616160';
        ctx.fillText('   /   ', mdx, mdy);
        mdx += ctx.measureText('   /   ').width;

        ctx.font = '200 21px '+fontfile;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(tempMatchDetails2, mdx, mdy);

        mdx += ctx.measureText(tempMatchDetails2).width;
        ctx.font = '400 21px '+fontfile;
        ctx.fillStyle = '#616160';
        ctx.fillText('   /   ', mdx, mdy);
        mdx += ctx.measureText('   /   ').width;

        ctx.font = '200 21px '+fontfile;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(tempMatchDetails3, mdx, mdy);

        mdx += ctx.measureText(tempMatchDetails3).width;
        ctx.font = '400 21px '+fontfile;
        ctx.fillStyle = '#616160';
        ctx.fillText('   /   ', mdx, mdy);
        mdx += ctx.measureText('   /   ').width;

        ctx.font = '200 21px '+fontfile;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(tempMatchDetails4, mdx, mdy);

        /// text color
        if (rated1) {
          ctx.fillStyle = '#FFFFFF';
        } else {
          ctx.fillStyle = squadColours[squad_dict[home_team].slug];
        }
        
        var curx = 120;
        var cury = 310;
        var curx2 = curx+268;//370;
        var evx = curx+230;
        var scurx = curx+348;
        var scurx2 = scurx+268;
        var sevx = scurx+230;
        var scury = 310+46+46;
        var eventIconMargin = 34;

        /// draw text on top
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        for (var index in data2) {
          obj = data2[index];
          if (obj.rating) {
            sq1c ++;
            sq1Rating += parseInt(obj.rating);
          }
          if (obj.is_sub == 0) {
            if (rated1) {
              ctx.fillStyle = '#FFFFFF';
            } else {
              ctx.fillStyle = squadColours[squad_dict[home_team].slug];
            }

            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'left';
            ctx.fillText(player_dict[obj.member_id].name, curx, cury);
            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'right';
            ctx.fillText((rated1 ? obj.rating : '-'), curx2, cury);

            tmpEVX = evx-24;
            tmpEVY = cury+2;
            // obj.rcards = 1;
            // obj.goals = 2;
            if (obj.rcards > 0) {
              ctx.drawImage(red_card_icon, tmpEVX, tmpEVY, 24, 24);
              tmpEVX -= eventIconMargin;
            } else {
              if (obj.ycards > 1) {
                ctx.drawImage(yellow_red_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              } else if (obj.ycards > 0) {
                ctx.drawImage(yellow_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              }
            }
            if (obj.goals > 1) {
              tmpEVX += 24;
              ctx.font = '200 20px '+fontfile;
              ctx.fillText(obj.goals, tmpEVX, tmpEVY+3);
              tmpEVX -= (24 + ctx.measureText(obj.goals).width + 4);
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            } else if (obj.goals > 0) {
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            }
            cury += 46;
          } else if (obj.is_sub == 1 && obj.has_played == 1) {
            if (rated1) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            } else {
              var tempRGB = rating_controller.hexToRgb(squadColours[squad_dict[home_team].slug]);
              ctx.fillStyle = 'rgba('+tempRGB.r+','+tempRGB.g+','+tempRGB.b+', 0.6)';
            }

            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'left';
            ctx.fillText(player_dict[obj.member_id].name, scurx, scury);
            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'right';
            ctx.fillText((rated1 ? obj.rating : '-'), scurx2, scury);

            tmpEVX = sevx-24;
            tmpEVY = scury+2;
            // obj.rcards = 1;
            // obj.goals = 2;
            if (obj.rcards > 0) {
              ctx.drawImage(red_card_icon, tmpEVX, tmpEVY, 24, 24);
              tmpEVX -= eventIconMargin;
            } else {
              if (obj.ycards > 1) {
                ctx.drawImage(yellow_red_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              } else if (obj.ycards > 0) {
                ctx.drawImage(yellow_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              }
            }
            if (obj.goals > 1) {
              tmpEVX += 24;
              ctx.font = '200 20px '+fontfile;
              ctx.fillText(obj.goals, tmpEVX, tmpEVY+3);
              tmpEVX -= (24 + ctx.measureText(obj.goals).width + 4);
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            } else if (obj.goals > 0) {
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            }
            scury += 46;
          }
        }

        curx = 1010;
        cury = 310;
        curx2 = curx+268;//1260;
        evx = curx+230;
        scurx = curx+348;
        scurx2 = scurx+268;
        sevx = scurx+230;
        scury = 310+46+46;

        for (var index in data3) {
          obj = data3[index];
          if (obj.rating) {
            sq2c ++;
            sq2Rating += parseInt(obj.rating);
          }
          if (obj.is_sub == 0) {
            if (rated2) {
              ctx.fillStyle = '#FFFFFF';
            } else {
              ctx.fillStyle = squadColours[squad_dict[home_team].slug];
            }

            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'left';
            ctx.fillText(player_dict[obj.member_id].name, curx, cury);
            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'right';
            ctx.fillText((rated2 ? obj.rating : '-'), curx2, cury);

            tmpEVX = evx-24;
            tmpEVY = cury+2;
            // obj.rcards = 1;
            // obj.goals = 2;
            // obj.ycards = 2;
            if (obj.rcards > 0) {
              ctx.drawImage(red_card_icon, tmpEVX, tmpEVY, 24, 24);
              tmpEVX -= eventIconMargin;
            } else {
              if (obj.ycards > 1) {
                ctx.drawImage(yellow_red_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              } else if (obj.ycards > 0) {
                ctx.drawImage(yellow_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              }
            }
            if (obj.goals > 1) {
              tmpEVX += 24;
              ctx.font = '200 20px '+fontfile;
              ctx.fillText(obj.goals, tmpEVX, tmpEVY+3);
              tmpEVX -= (24 + ctx.measureText(obj.goals).width + 4);
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            } else if (obj.goals > 0) {
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            }
            cury += 46;
          } else if (obj.is_sub == 1 && obj.has_played == 1) {
            if (rated2) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            } else {
              var tempRGB = rating_controller.hexToRgb(squadColours[squad_dict[home_team].slug]);
              ctx.fillStyle = 'rgba('+tempRGB.r+','+tempRGB.g+','+tempRGB.b+', 0.6)';
            }

            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'left';
            ctx.fillText(player_dict[obj.member_id].name, scurx, scury);
            ctx.font = '400 30px '+fontfile;
            ctx.textAlign = 'right';
            ctx.fillText((rated2 ? obj.rating : '-'), scurx2, scury);

            tmpEVX = sevx-24;
            tmpEVY = scury+2;
            // obj.rcards = 1;
            // obj.goals = 2;
            if (obj.rcards > 0) {
              ctx.drawImage(red_card_icon, tmpEVX, tmpEVY, 24, 24);
              tmpEVX -= eventIconMargin;
            } else {
              if (obj.ycards > 1) {
                ctx.drawImage(yellow_red_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              } else if (obj.ycards > 0) {
                ctx.drawImage(yellow_card_icon, tmpEVX, tmpEVY, 24, 24);
                tmpEVX -= eventIconMargin;
              }
            }
            if (obj.goals > 1) {
              tmpEVX += 24;
              ctx.font = '200 20px '+fontfile;
              ctx.fillText(obj.goals, tmpEVX, tmpEVY+3);
              tmpEVX -= (24 + ctx.measureText(obj.goals).width + 4);
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            } else if (obj.goals > 0) {
              ctx.drawImage(goal_icon, tmpEVX, tmpEVY, 24, 24);
            }
            scury += 46;
          }
        }

        sq1Rating /= sq1c;
        sq2Rating /= sq2c;

        ctx.textAlign = 'left';

        curx = 120;
        scurx = curx+348;
        scury = 330;

        if (rated1) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        } else {
          var tempRGB = rating_controller.hexToRgb(squadColours[squad_dict[home_team].slug]);
          ctx.fillStyle = 'rgba('+tempRGB.r+','+tempRGB.g+','+tempRGB.b+', 0.6)';
        }

        ctx.font = '600 26px '+fontfile;
        ctx.fillText('substitutes', scurx, scury);

        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth=1;

        ctx.beginPath();
        ctx.moveTo(scurx, 316);
        ctx.lineTo(scurx+270, 316);
        ctx.stroke();

        ctx.lineWidth=1;

        ctx.beginPath();
        ctx.moveTo(scurx, 370);
        ctx.lineTo(scurx+270, 370);
        ctx.stroke();


        curx = 1010;
        scurx = curx+348;
        scury = 330;

        if (rated2) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        } else {
          var tempRGB = rating_controller.hexToRgb(squadColours[squad_dict[home_team].slug]);
          ctx.fillStyle = 'rgba('+tempRGB.r+','+tempRGB.g+','+tempRGB.b+', 0.6)';
        }

        ctx.font = '600 26px '+fontfile;
        ctx.fillText('substitutes', scurx, scury);

        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth=1;

        ctx.beginPath();
        ctx.moveTo(scurx, 316);
        ctx.lineTo(scurx+270, 316);
        ctx.stroke();

        ctx.lineWidth=1;

        ctx.beginPath();
        ctx.moveTo(scurx, 370);
        ctx.lineTo(scurx+270, 370);
        ctx.stroke();

        angle = Math.PI * 1.1,
        radius = 87;
        radius2 = 66;
        centerX = 536 + 66;
        centerY = 660 + 66;

        var div = document.createElement("div");
            div.innerHTML = (Math.round(parseFloat(sq1Rating) * 10)/10.0).toFixed(1);
            div.style.position = 'absolute';
            div.style.top  = '-9999px';
            div.style.left = '-9999px';
            div.style.fontFamily = fontfile;
            div.style.fontWeight = '700';
            div.style.fontSize = '52px';
        document.body.appendChild(div);
        var heightRatFont = div.offsetHeight;
        document.body.removeChild(div);

        if (rated1) {
          ctx.font = '700 30px '+fontfile;
          ctx.textAlign = 'center';
          ctx.fillStyle = squadColours[squad_dict[home_team].slug];
          ctx.strokeStyle = squadColours[squad_dict[home_team].slug];
          ctx.lineWidth = 1;
          // rating_controller.drawTextAlongArc(ctx, 'CHELSEA AV.         ', centerX, centerY, radius, angle);
          rating_controller.getCircularText(ctx, squad_dict[squad1].short_name.toUpperCase()+' AV.', centerX, centerY, radius*2 + 16, 27, 'left', false, true);

          ctx.drawImage(large_star, 656, 640, 26, 26);

          // Draw black rectangle
          ctx.fillStyle = squadColours[squad_dict[home_team].slug];
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius2, 0, 2 * Math.PI, false);
          ctx.fill();

          // Punch out the text!
          ctx.globalCompositeOperation = 'destination-out';
          ctx.textBaseline = 'middle';
          ctx.font = '700 52px '+fontfile;
          var tmpRat = (Math.round(parseFloat(sq1Rating) * 10)/10.0).toFixed(1);
          ctx.fillText(tmpRat, centerX, centerY );
          ctx.textBaseline = 'top';
        }

        ctx.globalCompositeOperation = 'source-over';

        centerX = 1424 + 66;

        if (rated2) {
          ctx.font = '700 30px '+fontfile;
          ctx.textAlign = 'center';
          ctx.fillStyle = squadColours[squad_dict[home_team].slug];
          ctx.strokeStyle = squadColours[squad_dict[home_team].slug];
          ctx.lineWidth = 1;
          // rating_controller.drawTextAlongArc(ctx, 'CHELSEA AV.         ', centerX, centerY, radius, angle);
          rating_controller.getCircularText(ctx, squad_dict[squad2].short_name.toUpperCase()+' AV.', centerX, centerY, radius*2 + 16, 27, 'left', false, true);

          ctx.drawImage(large_star, 1542, 640, 26, 26);

          // Draw black rectangle
          ctx.fillStyle = squadColours[squad_dict[home_team].slug];
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius2, 0, 2 * Math.PI, false);
          ctx.fill();

          // Punch out the text!
          ctx.globalCompositeOperation = 'destination-out';
          ctx.textBaseline = 'middle';
          ctx.font = '700 52px '+fontfile;
          var tmpRat = (Math.round(parseFloat(sq2Rating) * 10)/10.0).toFixed(1);
          ctx.fillText(tmpRat, centerX, centerY );
          ctx.textBaseline = 'top';
        }

        ctx.globalCompositeOperation = 'source-over';

        starX = 872;
        starY = 322;
        starYstep = 37;

        for (var ind = 0; ind < 10; ++ind ) {
          ctx.drawImage(small_star, starX, starY, 14, 14);
          starY += starYstep + 14;
        }

        ctx.globalCompositeOperation = 'destination-over';

        ctx.drawImage(sbg, 0, 0, fw, 880);


        // canvas = rating_controller.downScaleCanvas(canvas, 0.5);
        

        // $(baseClass+' #share-container').show();
        // $(baseClass+' #share-canvas').show();

        /*** ADD ALERT NOTIF ***/

        // console.log(user.getNotif1());
        if (user.getNotif1() == "0") {
          if (navigator.notification) {
            navigator.notification.alert(
              'Share your ratings with friends and compare',  // message
              null,         // callback
              ' ',            // title
              'OK'                  // buttonName
            );
          } else {
            alert('Share your ratings with friends and compare');
          }
          user.setNotif1("1");
        }

        

        /***********************/

        // console.log(baseClass);
        // $(baseClass+' #share-container').show();
        // $(baseClass+' #share-buttons2').hide();
        // $(baseClass+' .team-selector').hide();
        // $(baseClass+' #my-rating-container').hide();
        // $(baseClass+' #share-buttons').hide();
        // $(baseClass+' .info-box-dd').hide();

        // $(baseClass+' .share-button2').on(clickEvent, function() {
          if (matchDuring) {
            if (navigator.notification) {
              navigator.notification.alert(
                'This match has not finished yet, you will be able to share your ratings after the match finishes',  // message
                null,         // callback
                ' ',            // title
                'OK'                  // buttonName
              );
            } else {
              alert('This match has not finished yet, you will be able to share your ratings after the match finishes');
            }
          } else {
            console.log('gonna share');
            if (window.plugins.socialsharing) {
              var t1 = squad_dict[squad1].short_name;
              var t2 = squad_dict[squad2].short_name;
              if (t1 == 'A Villa') t1 = 'Villa';
              if (t1 == 'C Palace') t1 = 'Palace';
              if (t1 == 'Man Utd') t1 = 'United';
              if (t1 == 'Man City') t1 = 'City';
              if (t1 == 'So\'ton') t1 = 'Southampton';
              if (t1 == 'S\'land') t1 = 'Sunderland';

              if (t2 == 'A Villa') t2 = 'Villa';
              if (t2 == 'C Palace') t2 = 'Palace';
              if (t2 == 'Man Utd') t2 = 'United';
              if (t2 == 'Man City') t2 = 'City';
              if (t2 == 'So\'ton') t2 = 'Southampton';
              if (t2 == 'S\'land') t2 = 'Sunderland';
                window.plugins.socialsharing.share('Here\'s my say on the '+t1+' – '+t2+' match. Head to www.starating.net to have yours.', 'starating ' + t1 + ' ' + t2, canvas.toDataURL("image/png"), '', function() { /*window.location.href = "dashboard.html?md=" + rating_controller.getMatchDayOfMatch();*/ });
            } else {
              console.log('prob');
              if (navigator.notification) {
                navigator.notification.alert(
                  'There seems to be a problem, please try again',  // message
                  null,         // callback
                  'Error',            // title
                  'OK'                  // buttonName
                );
              } else {
                alert('There seems to be a problem, please try again');
              }
            }
          }
          
        // });

        //END DRAW

      }//END yellow_red_card_icon LOAD
      yellow_red_card_icon.src = 'img/yellow_red_card_icon.png';

      }//END yellow_card_icon LOAD
      yellow_card_icon.src = 'img/yellow_card_icon.png';

      }//END red_card_icon LOAD
      red_card_icon.src = 'img/red_card_icon.png';

      }//END goal_icon LOAD
      goal_icon.src = 'img/goal_icon.png';

      }//END large_star LOAD
      large_star.src = 'img/share/large_star_'+squad_dict[home_team].slug+'.png';

      }//END small_star LOAD
      small_star.src = 'img/share/small_star_'+squad_dict[home_team].slug+'.png';

      }//END shl LOAD
      shl.src = 'img/share_logo2.png';

      }//END SBG LOAD
      sbg.src = 'img/share_bgs/'+squad_dict[home_team].slug+'.png';

      
    },

    // scales the image by (float) scale < 1
    // returns a canvas containing the scaled image.
    downScaleImage: function(img, scale) {
        var imgCV = document.createElement('canvas');
        imgCV.width = img.width;
        imgCV.height = img.height;
        var imgCtx = imgCV.getContext('2d');
        imgCtx.drawImage(img, 0, 0);
        return downScaleCanvas(imgCV, scale);
    },

    // scales the canvas by (float) scale < 1
    // returns a new canvas containing the scaled image.
    downScaleCanvas: function(cv, scale) {
        if (!(scale < 1) || !(scale > 0)) throw ('scale must be a positive number <1 ');
        var sqScale = scale * scale; // square scale = area of source pixel within target
        var sw = cv.width; // source image width
        var sh = cv.height; // source image height
        var tw = Math.floor(sw * scale); // target image width
        var th = Math.floor(sh * scale); // target image height
        var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
        var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
        var tX = 0, tY = 0; // rounded tx, ty
        var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
        // weight is weight of current source point within target.
        // next weight is weight of current source point within next target's point.
        var crossX = false; // does scaled px cross its current px right border ?
        var crossY = false; // does scaled px cross its current px bottom border ?
        var sBuffer = cv.getContext('2d').
        getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
        var tBuffer = new Float32Array(3 * tw * th); // target buffer Float32 rgb
        var sR = 0, sG = 0,  sB = 0; // source's current point r,g,b
        /* untested !
        var sA = 0;  //source alpha  */    

        for (sy = 0; sy < sh; sy++) {
            ty = sy * scale; // y src position within target
            tY = 0 | ty;     // rounded : target pixel's y
            yIndex = 3 * tY * tw;  // line index within target array
            crossY = (tY != (0 | ty + scale)); 
            if (crossY) { // if pixel is crossing botton target pixel
                wy = (tY + 1 - ty); // weight of point within target pixel
                nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
            }
            for (sx = 0; sx < sw; sx++, sIndex += 4) {
                tx = sx * scale; // x src position within target
                tX = 0 |  tx;    // rounded : target pixel's x
                tIndex = yIndex + tX * 3; // target pixel index within target array
                crossX = (tX != (0 | tx + scale));
                if (crossX) { // if pixel is crossing target pixel's right
                    wx = (tX + 1 - tx); // weight of point within target pixel
                    nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
                }
                sR = sBuffer[sIndex    ];   // retrieving r,g,b for curr src px.
                sG = sBuffer[sIndex + 1];
                sB = sBuffer[sIndex + 2];

                /* !! untested : handling alpha !!
                   sA = sBuffer[sIndex + 3];
                   if (!sA) continue;
                   if (sA != 0xFF) {
                       sR = (sR * sA) >> 8;  // or use /256 instead ??
                       sG = (sG * sA) >> 8;
                       sB = (sB * sA) >> 8;
                   }
                */
                if (!crossX && !crossY) { // pixel does not cross
                    // just add components weighted by squared scale.
                    tBuffer[tIndex    ] += sR * sqScale;
                    tBuffer[tIndex + 1] += sG * sqScale;
                    tBuffer[tIndex + 2] += sB * sqScale;
                } else if (crossX && !crossY) { // cross on X only
                    w = wx * scale;
                    // add weighted component for current px
                    tBuffer[tIndex    ] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // add weighted component for next (tX+1) px                
                    nw = nwx * scale
                    tBuffer[tIndex + 3] += sR * nw;
                    tBuffer[tIndex + 4] += sG * nw;
                    tBuffer[tIndex + 5] += sB * nw;
                } else if (crossY && !crossX) { // cross on Y only
                    w = wy * scale;
                    // add weighted component for current px
                    tBuffer[tIndex    ] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // add weighted component for next (tY+1) px                
                    nw = nwy * scale
                    tBuffer[tIndex + 3 * tw    ] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                } else { // crosses both x and y : four target points involved
                    // add weighted component for current px
                    w = wx * wy;
                    tBuffer[tIndex    ] += sR * w;
                    tBuffer[tIndex + 1] += sG * w;
                    tBuffer[tIndex + 2] += sB * w;
                    // for tX + 1; tY px
                    nw = nwx * wy;
                    tBuffer[tIndex + 3] += sR * nw;
                    tBuffer[tIndex + 4] += sG * nw;
                    tBuffer[tIndex + 5] += sB * nw;
                    // for tX ; tY + 1 px
                    nw = wx * nwy;
                    tBuffer[tIndex + 3 * tw    ] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                    // for tX + 1 ; tY +1 px
                    nw = nwx * nwy;
                    tBuffer[tIndex + 3 * tw + 3] += sR * nw;
                    tBuffer[tIndex + 3 * tw + 4] += sG * nw;
                    tBuffer[tIndex + 3 * tw + 5] += sB * nw;
                }
            } // end for sx 
        } // end for sy

        // create result canvas
        var resCV = document.createElement('canvas');
        resCV.width = tw;
        resCV.height = th;
        var resCtx = resCV.getContext('2d');
        var imgRes = resCtx.getImageData(0, 0, tw, th);
        var tByteBuffer = imgRes.data;
        // convert float32 array into a UInt8Clamped Array
        var pxIndex = 0; //  
        for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
            tByteBuffer[tIndex] = Math.ceil(tBuffer[sIndex]);
            tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
            tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
            tByteBuffer[tIndex + 3] = 255;
        }
        // writing result to canvas.
        resCtx.putImageData(imgRes, 0, 0);
        return resCV;
    },

    getCircularText: function(ctxRef, text, centerX, centerY, diameter, startAngle, align, textInside, inwardFacing, fName, fSize) {
      // Text: The text to be displayed in circular fashion
      // diameter: The diameter of the circle around which the text will be displayed (inside or outside)
      // startAngle: where the text will be shown. 0 degrees if the top of the circle.
      // fName: name of font family. Make sure it is loaded
      // fSize: size of font family. Don't forget to include points/pixels etc.
      // textInside: true to show inside the circle. False to show outside.
      // inwardFacing: true for text base facing inward. false to show text base facing out
      // align: Left positions text to left of startAngle. Right and center also work.
      //--------------------------------------------------------------------------
      // Directions
      // A note on alignment: to the left means left of zero degrees - ie, top of circle.
      // if you want to draw on an existing canvas, you can send in a ctx reference instead along
      // with an x and y position which will be center of the circle. specify them in the drawText
      // function in the final for loop.

      ctxRef.save();

      // Lets go... declare and intialize canvas, reference, and useful variables
      align = align.toLowerCase();
      var textLen = text.length; // number of characters in text
      var clockwise = align == "right" ? 1 : -1; // draw clockwise for aligned right
      var startAngle = startAngle * (Math.PI / 180); // convert to radians

      var textHeight = 36;

      // in cases where we are drawing outside an imaginary circle, expand diameter to handle it
      if (!textInside) diameter += textHeight;

      // Reverse letters for align Left inward, align right outward and align center inward
      if (((["left", "center"].indexOf(align) > -1) && inwardFacing) || (align == "right" && !inwardFacing)) text = text.split("").reverse().join(""); // not the best string reverser!

      // Setup letters and positioning
      ctxRef.translate(centerX, centerY); // Move to center
      startAngle += (Math.PI * !inwardFacing); // Rotate 180 if outward facing
      ctxRef.textBaseline = 'middle'; // Ensure we draw in exact center
      ctxRef.textAlign = 'center'; // Ensure we draw in exact center

      // rotate 50% of total angle for center alignment
      if (align == "center") {
          for (var j = 0; j < textLen; j++) {
              var charWid = ctxRef.measureText(text[j]).width;
              startAngle += Math.atan(charWid / (diameter / 2 - textHeight)) / 2 * -clockwise;
          }
      }

      // Phew... now rotate into final start position
      ctxRef.rotate(startAngle);

      // Now for the fun bit: draw, rotate, and repeat
      for (var j = 0; j < textLen; j++) {
          var charWid = ctxRef.measureText(text[j]).width - 1; // half current letter
          ctxRef.rotate(Math.atan(charWid / (diameter / 2 - textHeight)) / 2 * clockwise); // rotate half letter

          // draw the character at "top" or "bottom" depending on inward or outward facing
          ctxRef.fillText(text[j], 0, (inwardFacing ? 1 : -1) * (0 - diameter / 2 + textHeight / 2));

          ctxRef.rotate(Math.atan(charWid / (diameter / 2 - textHeight)) / 2 * clockwise); // rotate half letter
      }

      ctxRef.restore();
    },

    drawTextAlongArc: function(context, str, centerX, centerY, radius, angle) {
      var len = str.length, s;
      context.save();
      context.translate(centerX, centerY);
      context.rotate(-1 * angle / 2);
      context.rotate(-1 * (angle / len) / 2);
      for(var n = 0; n < len; n++) {
        context.rotate(angle / len);
        context.save();
        context.translate(0, -1 * radius);
        s = str[n];
        context.fillText(s, 0, 0);
        context.restore();
      }
      context.restore();
    },

    roundRect:function(ctx, x, y, width, height, radius, fill, stroke, shadow) {
      if (typeof stroke == "undefined" ) {
        stroke = true;
      }
      if (typeof radius === "undefined") {
        radius = 5;
      }
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (stroke) {
        ctx.stroke();
      }
      if (shadow) {
        ctx.shadowColor = 'rgba( 0, 0, 0, 0.35 )';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
      } else {
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      if (fill) {
        ctx.fill();
      }        
    },

    backingScale:function(context) {
      if ('devicePixelRatio' in window) {
        if (window.devicePixelRatio > 1) {
          return window.devicePixelRatio;
        }
      }
      return 1;
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
