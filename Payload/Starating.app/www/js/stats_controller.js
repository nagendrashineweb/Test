define(['jquery', 'user', 'rest', 'squad_database', 'player_database', 'general'], function ($, user, rest, squad_db, player_db, general) {

  var squad_dict;
  var player_dict;
  var stats_dict;
  var match_dict;
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
  var baseClass;
  var lit = -1;
  var larr = [{'type': 'Goalkeepers', 'bc': 'stats-g'},
      {'type': 'Forwards', 'bc': 'stats-f'}, 
      {'type': 'Midfielders', 'bc': 'stats-m'},
      {'type': 'Defenders', 'bc': 'stats-d'}];
  var callback;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');
  var currentTarget = ".content-All";

  var statsController = {

    initAll: function() {

      lit = -1;
      userObj = user.getUser();
      statsController.init('All', 'stats-a', statsController.loadNext);

    },

    loadNext: function() {
      ++lit;
      if (lit < larr.length) {
        currentTarget = '.content-' + larr[lit].type;
        statsController.init(larr[lit].type, larr[lit].bc, statsController.loadNext);
      } else {
        callback = null;
        $('.inner-content').fadeIn();
      }
    },

    init: function(ptype, bc, callbk){

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

      // $('.ui-page-active .info-box-dd .ib-dd-top').off();
      // $('.ui-page-active .info-box-dd .ib-dd-top').on(clickEvent, function(){
      $('body').off(clickEvent, currentTarget+' .info-box-dd .ib-dd-top');
      $('body').on(clickEvent, currentTarget+' .info-box-dd .ib-dd-top', function(){
        var alreadyActive = false;
        var sDuration = 800;
        $arr = $(this).find('.arrow-up');
        $el = $(this).parent().find('.ib-dd-content');
        if ($(this).hasClass('ibd1')) {
          $this2 = $('.content-ghost .info-box-dd .ib-dd-top.ibd1');
        } else if ($(this).hasClass('ibd2')) {
          $this2 = $('.content-ghost .info-box-dd .ib-dd-top.ibd2');
        } else if ($(this).hasClass('ibd3')) {
          $this2 = $('.content-ghost .info-box-dd .ib-dd-top.ibd3');
        } else if ($(this).hasClass('ibd4')) {
          $this2 = $('.content-ghost .info-box-dd .ib-dd-top.ibd4');
        }
        $arrg = $this2.find('.arrow-up');
        $elg = $this2.parent().find('.ib-dd-content');
        if ($el.hasClass('active')) {
          alreadyActive = true;
        }

        if (!alreadyActive) {
          $el.addClass('active');
          $el.slideToggle(sDuration);
          $arr.addClass('open');
          $elg.addClass('active');
          $elg.slideToggle(sDuration);
          $arrg.addClass('open');
        } else {
          $el.removeClass('active');
          $el.slideToggle(sDuration);
          $arr.removeClass('open');
          $elg.removeClass('active');
          $elg.slideToggle(sDuration);
          $arrg.removeClass('open');
        }
      });

      type = ptype;
      baseClass = bc;
      callback = callbk;

      fav_squadid = parseInt(userObj.team_id);

      statsController.setupData();
    },

    setupData: function(){

      squad_db.getData(function(data){
        squad_dict = data;

        player_db.getData(function(data){
          player_dict = data;
          fav_squadid = parseInt(userObj.team_id);

          statsController.pullTop(type);
        });
      });
    },

    pullTopLast5: function(type){
      // $('.spinner-overlay').data('display', '0');
      // $('.spinner').show();
      // $('.spinner-overlay').show();
      rest.get('stats/last5Top/'+ type +'/20','').done(function(data){
        $('.' + baseClass + ' #top-twenty-container-l5-'+type).html('');
        $.each(data, function(i, v){
              $('.' + baseClass + ' #top-twenty-container-l5-'+type).append(statsController.createRatingElement(v));
          });
        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        general.hideLoader();
        $('.ui-page-active .inner-content').fadeIn();

        if (callback) {
          callback();
        }
      }).fail(function() {
        // $('.spinner-overlay').data('display', '1');
        // $('.spinner').fadeOut(200);
        // $('.spinner-overlay').fadeOut(200);
        // $('.ui-page-active .inner-content').fadeIn();
        general.hideLoader();
        general.showNoInternet();
      });
    },

    pullTop: function(type){
      rest.get('stats/globalTop/'+ type +'/20','').done(function(data){
        $('.' + baseClass + ' #top-twenty-container-'+type).html('');
        $.each(data, function(i, v){
              $('.' + baseClass + ' #top-twenty-container-'+type).append(statsController.createRatingElement(v));
          });
        statsController.pullTopLast5(type);
        /*$('.spinner-overlay').data('display', '1');
        $('.spinner').fadeOut(200);
        $('.spinner-overlay').fadeOut(200);
        $('.ui-page-active .inner-content').fadeIn();*/
      }).fail(function() {
        general.hideLoader();
        general.showNoInternet();
        // statsController.pullTopLast5(type);
      });
    },

    createRatingElement:function(data){
      return '<a class="stats-player" data-ajax="false" href="player_stats.html?player='+data.member_id+'"><div class="st-rate-width" style="width:' + (Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1)*10 + '%"></div><div class="st-team-badge" style="background-image:url(img/' + squad_dict[data.squad_id].slug + '_large'+(parseInt(data.squad_id) == fav_squadid ? '' : '_nf')+'.png);"></div><h1 class="st-player">' + player_dict[data.member_id].name + '</h1><h1 class="st-rating">' + (Math.round(parseFloat(data.rating) * 10)/10.0).toFixed(1) + /*data.rating  +*/ '</h1></a>';
    }

  };

  return statsController;

});
