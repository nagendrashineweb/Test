define(['jquery', 'user', 'rest', 'squad_database', 'player_database', 'hcharts', 'jqm', 'general'], function ($, user, rest, squad_db, player_db, hchart, jqm, general) {
  $( document ).ready(function() {
  });

  var squad_dict;
  var player_dict;
  var stats_dict;
  var type;
  var fav_squadid;
  var current_md;
  var matches_team;
  var max_md;
  var md1, md2;
  var theChart;
  var theChart2;
  var firstDS;
  var secondDS;
  var chartOptions;
  var userObj;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var eventsData;
  var prevmd1, prevmd2;

  var playerStatsController = {

    init: function(pid){
      userObj = user.getUser();
      fav_squadid = parseInt(userObj.team_id);

      playerStatsController.loadPlayer(pid);
    },

    loadPlayer: function(player_id){

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

        player_db.getData(function(data){
          player_dict = data;

          // $('body').attr('style', 'background-image:url("img/bgs/' + squad_dict[player_dict[player_id].team_id].slug +'.png");');
          $('body').addClass('bg-'+squad_dict[player_dict[player_id].team_id].slug);

          playerStatsController.setUpPlayerStatistics(player_id);
        });
      });
    },

    pullDataForChart:function(playerId){
      //stats/getChartData/{playerid}/{userId}
      var uid = userObj.id;
      var myRatings = rest.get('stats/getChartData/' + playerId + '/' + uid + "/" + player_dict[playerId].team_id ).done(function(data){
        matches_team = data.matches;
        playerStatsController.createChart(data.users, data.everyone, data.matches);
        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        general.hideLoader();
        $('.inner-content').fadeIn();
      });
    },

    PullGlobalRating:function(playerId){
      // var myRatings = rest.get('stats/getGlobalPerplayer/' + playerId).done(function(data){
      //   $('#selected-player div.tb-right').text((Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1));
      // });

      //matches/playerStats/{playerId}
      var playerStats = rest.get('matches/playerStats/' + playerId).done(function(data){

        eventsData = data.eventsData;
        playerStatsController.pullDataForChart(playerId);

        $('#selected-player div.tb-right').text((Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1));

        if (data.position2 == "Goalkeepers") {
          $('pi-goals').hide();
        }
        if (data.position != 1) {
          $('pi-cs').hide();
        } else {
          $('.pi-cs').html('<span style="font-weight: 600;">CS</span> : ' + data.cleanSheets);
        }

        $('#pi-apps').html('<span style="font-weight: 600;">APP</span> : ' + data.appearances);
        $('.pi-goals').text(data.goals);
        $('.pi-yellows').text(data.ycards);
        $('.pi-reds').text(data.rcards);
      });
    },

    setUpPlayerStatistics:function(playerId){
      squadid = player_dict[playerId].team_id;
      $('#selected-player').html(player_dict[playerId].name + '<div class="tb-right"></div>');
      $('.re-player').html(player_dict[playerId].name);
      $('#player-team').text(squad_dict[squadid].name);
      $('.re-shirt').text(player_dict[playerId].shirt_number);
      $('.title-team-badge').attr('style', 'background-image:url(img/' + squad_dict[squadid].slug + '_large'+(parseInt(squadid) == fav_squadid ? '' : '_nf')+'.png); display:block;');

      playerStatsController.PullGlobalRating(playerId);
    },

    updateMatch:function(match_day, data, forceChange) {
      var score = data.score;
      score = score.replace(' - ', ':');
      score = score.replace('-', ':');
      score = score.replace(' V ', 'n');
      score = score.replace(' v ', 'n');
      score = score.replace('V', 'n');
      score = score.replace('v', 'n');
      score = score.replace('n', 'vs');

      //score = "1:1";
      var score2 = score.split(/[:]/);
      if (score == "vs") {
        score2[0] = "";
        score2[1] = "";
      } else {
        score2[0] = score2[0].trim();
        score2[1] = score2[1].trim();
      }

      // Split timestamp into [ Y, M, D, h, m, s ]
      var t = data.started.split(/[- :]/);
      var monthNames = [ "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December" ];

      // Apply each element to the Date function
      var datetime = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
      //var datetime = Date.parse(data.started);
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
      year = year.substring(2, 4);
      //dateString += " " + datetime.getFullYear() + " " + hrs + ":" + mins;
      dateString1 = datetime.getDate() + "/" + mm + "/" + year;
      dateString2 = hrs + ":" + mins;

      var stadium = squad_dict[data.host_team_id].stadium;
      var tmp = stadium.indexOf("(");
      if (stadium[tmp-1] == ' ') {
        tmp --;
      }
      stadium = stadium.substring(0, tmp);

      var sc = score2[0] + " : " + score2[1];
      if (score2[0] == "") {
        sc = "vs";
      }

      $('.pi-bottom-match .pi-b-m-top').html(squad_dict[data.host_team_id].short_name + "&nbsp;" + sc + "&nbsp;" + squad_dict[data.guest_team_id].short_name);
      $('.pi-b-m-bottom').html('Minutes Played : ' + data.minutes_played);

      if (eventsData[data.id]) {
        ed = eventsData[data.id];
        if (ed.goals != 0) {
          $('.re-goals').removeClass('hidden');
          $('.re-goals').html(ed.goals > 1 ? ed.goals : '');
        } else {
          $('.re-goals').addClass('hidden');
          $('.re-goals').html('');
        }

        if (ed.ycards == 1 && ed.rcards == 0 && ed.yrcards == 0) {
          $('.re-cards-yellow').removeClass('hidden');
        } else {
          $('.re-cards-yellow').addClass('hidden');
        }

        if (ed.yrcards > 0) {
          $('.re-cards-yr').removeClass('hidden');
        } else {
          $('.re-cards-yr').addClass('hidden');
        }

        if (ed.rcards > 0) {
          $('.re-cards-red').removeClass('hidden');
        } else {
          $('.re-cards-red').addClass('hidden');
        }
      } else {
        $('.re-goals').addClass('hidden');
        $('.re-goals').html('');
        $('.re-cards-yellow').addClass('hidden');
        $('.re-cards-yr').addClass('hidden');
        $('.re-cards-red').addClass('hidden');
      }

      // pcont += '<div class="re-goals '+(obj.goals == 0 ? 'hidden' : '')+'">'+(obj.goals > 1 ? obj.goals : '')+'</div>';
      // pcont += '<div class="re-cards-yellow '+((obj.ycards == 0 || obj.ycards > 1) || obj.rcards > 0 ? 'hidden' : '')+'"></div>';
      // pcont += '<div class="re-cards-yr '+(obj.ycards < 2 ? 'hidden' : '')+'"></div>';
      // pcont += '<div class="re-cards-red '+(obj.rcards == 0 ? 'hidden' : '')+'"></div>';


      var l1 = 8;
      var l2 = 31;

      var noof = 8;
      var changed = false;

      md1 = prevmd1; //max_md - (noof - 1);
      // console.log(max_md);
      // console.log(current_md);
      // console.log(md1);
      if (md1 <= current_md && current_md <= prevmd2) {
        md2 = md1 + noof - 1;
      } else if (md1 > current_md) {
        md1 = current_md;
        md2 = md1 + noof - 1;
        changed = true;
      } else if (md2 < current_md) {
        md2 = current_md;
        md1 = md2 - (noof - 1);
        changed = true;
      }
      // console.log(md1);
      // console.log(md2);
      if (current_md == match_day) {
        changed = true;
      }

      prevmd1 = md1;
      prevmd2 = md2;

      /*if (match_day >= l1) {
        md1 = match_day - (noof - 1);
        md2 = md1 + noof - 1;
        changed = true;
      } else {
        if (match_day < l1) {
          md1 = 1;
          md2 = md1 + noof - 1;
        } else {
          md1 = 31;
          md2 = md1 + noof - 1;
        }
      }*/


      if (forceChange) {
        changed = true;
      }

      if (changed) {
        //noof = md2 - md1 + 1;
       if(md1<1)
       md1=1;
       
        first = firstDS.slice(md1 - 1, md2);
        second = secondDS.slice(md1 - 1, md2);
        tmpthird = firstDS.slice(md1 - 1, md2);
        prev = -1;
        for (var i = 0; i<first.length; ++i) {
          if (first[i] == 0) {
            first[i] = null;
            // third[i] = [i, 1];
            tmpthird[i] = [i, null];
          } else {
            if ((prev > -1) && (i-prev > 1)) {
              tmpthird[prev] = [prev, first[prev]];
              tmpthird[i] = [i, first[i]];
              prev = -1;
            } else {
              tmpthird[i] = [i, null];
            }
            prev = i;
            
          }
        };
        third = [];

        for (var i=0; i<tmpthird.length; ++i) {
          if (tmpthird[i][1] && tmpthird[i][1] > 0) {
            third.push(tmpthird[i]);
          }
        }

        /*for (var i=0; i<noof; ++i) {
          theChart.datasets[0].points[i].value = second[i];
          theChart.datasets[1].points[i].value = first[i];
          //theChart2.series[0].data.push(second[i], true);
          //theChart2.series[1].data.push(first[i], true);
        }*/

        // theChart2.series[0].setVisible(false);
        
        //theChart2.series[2].setData(third, true, false);
        theChart2.series[2].setVisible(false);
        //theChart2.series[1].setData(third, true, false);
        //column
        //theChart2.series[0].setData(second, true, {duration: 400, easing: 'linear' });//{duration: 400, easing: 'linear' });
        
        // theChart2.series[0].setVisible(true, true);
        
        
        //theChart2.series[2].setData(third, true);
        
        


        // theChart2.series[2].remove();
        // theChart2.series[1].remove();
        // theChart2.series[0].remove();
        // theChart2.addSeries({data:second});
        // theChart2.addSeries({data:first});
        // theChart2.addSeries({data:third});


        // NO ANIMATION REDRAW
        /*theChart2.series[0].update({
              data: second
          });

        theChart2.series[1].update({
              data: first
          });*/
        ///////////////////////////////

        // WITH ANIMATION COMPLETE REDRAW
        /*theChart2.destroy();
        chartOptions.series[0].data = second;
        chartOptions.series[1].data = first;
        theChart2 = new Highcharts.Chart(chartOptions);*/
        ///////////////////////////////

        //theChart2.redraw();
        
        //Chartjs
        //theChart.update();

      }

      // theChart2.series[1].data[7].setState('hover');
      if(theChart2.series[1].data[current_md - md1])
        theChart2.series[1].data[current_md - md1].select(true);      
      // theChart2.tooltip.refresh(theChart2.series[1].data[7]);
      // if (match_day >= l1) {
      //   theChart2.tooltip.refresh(theChart2.series[0].data[7]);
      // } else {
      //   if (match_day < l1) {
      //     theChart2.tooltip.refresh(theChart2.series[0].data[match_day - md1]);
      //   } else {
      //     theChart2.tooltip.refresh(theChart2.series[0].data[match_day - md1]);
      //   }
      // }
      

      $('.pi-match-days-wrapper').html('');
      for (var i=md1, j=0; i<=md2; ++i, ++j) {
        //lbl[j] = " ";
        var toAdd = '<div class="pi-md pi-md-'+noof+' '+(i == current_md ? 'active' : '')+'"><div class="pi-md-circle">'+i+'</div></div>';
        $('.pi-match-days-wrapper').append(toAdd);
        if (i == current_md) {
          if (first[j] && first[j] > 0) {
            $('.score').text(first[j]);
          } else {
            $('.score').html('&ndash;');
          }
          if (second[j] && second[j] > 0) {

            $('.re-rating-match').text((Math.round(parseFloat(second[j]) * 10)/10.0).toFixed(1));
            $('.np-rate-width').css('width', Math.round(parseFloat(second[j]) * 10)+'%');
            $('.np-rate-width').show();
          } else {
            $('.re-rating-match').text('N/A');
            $('.np-rate-width').hide();
          }
        }
      }

      $('.pi-bottom-matchday').text(current_md);

      if (current_md == max_md) {
        $('.pi-bottom-right').addClass('inactive');
      } else {
        $('.pi-bottom-right').removeClass('inactive');
      }

      if (current_md == 1) {
        $('.pi-bottom-left').addClass('inactive');
      } else {
        $('.pi-bottom-left').removeClass('inactive');
      }
    },

    createChart:function(first, second, matches){
        var randomScalingFactor = function(){ return Math.round(Math.random()*100)};

        for (var i = 0; i<first.length; ++i) {
          first[i] = parseFloat(first[i]);
        }

        for (var i = 0; i<second.length; ++i) {
          second[i] = parseFloat(second[i]);
        }

        firstDS = first;
        secondDS = second;

        while (second.length  < 2){
          second.push(0);
        }
        while (first.length  < 2){
          first.push(0);
        }

        match_day = window.localStorage.getItem('cmd');
        

        m = match_day;
        noof = 8;


        if (match_day < noof) {
          if (match_day < noof) {
            m = 1;
          } else {
            m = 31;
          }
        } else {
          m = match_day - 6;
        }

        max = match_day;
        max_md = match_day;
        var lbl = [];
        current_md = match_day;

        md1 = m;
        md2 = m+6;

        prevmd1 = max_md - (noof - 1);
        prevmd2 = prevmd1 + noof - 1;
        

        first = firstDS.slice(md1 - 1, md2);
        second = secondDS.slice(md1 - 1, md2);
        third = firstDS.slice(md1 - 1, md2);
        for (var i = 0; i<first.length; ++i) {
          if (first[i] == 0) {
            first[i] = null;
            third[i] = 1;
          } else {
            third[i] = null;
          }
        };


        // Navigate to the next page on swipeleft
        $( document ).on( "swiperight", "#container2", function( event ) {
            // Get the filename of the next page. We stored that in the data-next
            // attribute in the original markup.
            current_md -= 7;
            if (current_md < 1) {
              current_md = 1;
            }

            playerStatsController.updateMatch(current_md, matches_team[current_md-1], true);
        });
        // The same for the navigating to the previous page
        $( document ).on( "swipeleft", "#container2", function( event ) {
            current_md += 7;
            if (current_md > max_md) {
              current_md = max_md;
            }
            playerStatsController.updateMatch(current_md, matches_team[current_md-1], true);
        });

        $('.pi-bottom-left').on(clickEvent, function() {
          if (current_md > 1) {
            current_md--;
            playerStatsController.updateMatch(current_md, matches_team[current_md-1], false);
          }
        });

        $('.pi-bottom-right').on(clickEvent, function() {
          if (current_md < max_md) {
            current_md++;
            playerStatsController.updateMatch(current_md, matches_team[current_md-1], false);
          }
        });

        $('.pi-match-days-wrapper').html('');
        for (var i=m, j=0; i<m + 7 && i <= match_day; ++i, ++j) {
          lbl[j] = " ";
          var toAdd = '<div class="pi-md pi-md-'+noof+' '+(i == match_day ? 'active' : '')+'">'+i+'</div>';
          $('.pi-match-days-wrapper').append(toAdd);
        }

        chartOptions = {
          title: {
              text: null,
          },
          xAxis: {
              labels: {
                enabled: false
              },
              minorTickInterval: null,
              tickInterval: null,
              lineWidth: 0,
              minorGridLineWidth: 0,
              lineColor: 'transparent',
              minorTickLength: 0,
              tickLength: 0
          },
          yAxis: {
            max: 10,
            min: 0,
            title: {
                text: null
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: 'rgba(255,255,255,0)'
            }],
            tickInterval: 1,
            gridLineColor: 'rgba(255,255,255,0.4)',
            labels: {
              enabled: true,
               style: {
                  fontFamily: "'Inconsolata', 'Helvetica', 'Arial', sans-serif",
                  fontSize: '10px',
                  fontWeight: 'normal',
                  color: '#ffffff'
               },
               x: -8,
               align: 'right'
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#FFFFFF',
            borderWidth: 0,
            borderRadius: 8,
            shadow: false,
            useHTML: true,
            formatter: function () {
                //if (this.series.name == 'Your Rating')
                  // return false;
                return '<b>' + (Math.round(parseFloat(this.y) * 10)/10.0).toFixed(1) + '</b>';
            },
            style: {
              padding: 0
            },
            //shape: 'square'
          },
          legend: {
              enabled: false
          },
          credits: false,
          series: [{
              name: 'StaRating',
              data: second,
              type: 'column',
              fillColor: 'rgba(255, 255, 255, 0.4)',
              // minPointWidth:28,
              // pointWidth: 28,
              marker: {
                symbol: 'circle',
                fillColor: 'rgba(236,28,36,1)',
                lineWidth: 2,
                lineColor: null // inherit from series
              }
          }, {
              name: 'Your Rating',
              data: first,
              enableMouseTracking: false, //UNCOMMENT
              fillColor: 'rgba(0, 0, 0, 0)',
              marker: {
                symbol: 'circle',
                fillColor: 'rgba(255,255,255,1)',
                lineWidth: 0,
                lineColor: null, // inherit from series
                states: {
                  select: {
                    enabled: true,           // Enable or disable the point marker.
                    fillColor: null,         // The fill color of the marker in hover state.
                    lineColor: 'rgba(255,255,255,0.4)',    // The color of the point marker's outline. When null, the series' or point's color is used.
                    lineWidth: 5,            // The width of the point marker's outline.
                    radius: null             // The radius of the point marker. In hover state, it defaults to the normal state's radius + 2.
                  }
                }
              }
          }, {
              name: 'Your Rating-null',
              data: third,
              dashStyle: 'Dash',
              enableMouseTracking: false, //UNCOMMENT
              fillColor: 'rgba(0, 0, 0, 0)',
              marker: {
                symbol: 'circle',
                fillColor: 'rgba(255,255,255,1)',
                lineWidth: 0,
                lineColor: null // inherit from series
              }
          }]
        };

        Highcharts.theme = {
          colors: ["rgba(255, 255, 255, 0.4)", "rgba(255,255,255,1)", "rgba(255,255,255,1)"],
          chart: {
            backgroundColor: null,
            type: 'area',
            style: {
               fontFamily: "'Inconsolata', 'Helvetica', 'Arial', sans-serif",
               fontSize: '14px',
               color: '#ffffff'
            }
          },
        };

        Highcharts.setOptions(Highcharts.theme);
        $('#container2').highcharts(chartOptions);
        theChart2 = $('#container2').highcharts();

        // console.log(theChart2.series[0].data[0]);
        // console.log(theChart2.series[0].data[0].pointWidth);
        if (theChart2.series[0].data[0].pointWidth  <  28) {
          theChart2.series[0].options.pointWidth = 28;
        }

        /* END HIGHCHARTS */

        playerStatsController.updateMatch(match_day, matches[match_day-1]);

      }
  };

  return playerStatsController;

});
