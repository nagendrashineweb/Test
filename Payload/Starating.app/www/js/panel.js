define(['jquery', 'jqm', 'user', 'sidr', 'squad_database', 'rest', 'socialsharing'], function ($, jqm, user, sidr, squad_db, rest, socialsharing) {

  var userObj;
  var squad_dict;
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');

  var panel = {
    init: function(){
      userObj = user.getUser();

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
      
      //console.log("gonna run panel");
      //$(document).one("pagebeforecreate", function () {
        $.get('panel.html', function(data){ 
          $(data).prependTo("body"); // or .prependTo($.mobile.pageContainer);
          //$("[data-role=panel]").panel(); // initialize panel

          // console.log(userObj);
          // console.log(userObj.linked_account_id);
          // console.log(userObj.linked_account_type);
          if (userObj.linked_account_id) {
            if (userObj.profile_image) {
              if (userObj.linked_account_type == 2) { //fb  graph.facebook.com/10152380678997793/picture?type=large
                $('.sm-pp').attr('style', 'background-image: url("'+userObj.profile_image+'?type=large");');
              } else if (userObj.linked_account_type == 1) {
                console.log('tw');
                tmpImg = userObj.profile_image.replace('_normal', '_bigger');
                if (tmpImg.indexOf('.png') < 0) {
                  tmpImg += '/avatar_small_bigger.png';
                }
                console.log(tmpImg);
                $('.sm-pp').attr('style', 'background-image: url("'+tmpImg+'");');
              }
            } else {
              console.log('no profile_image');
              if (userObj.linked_account_type == 2) { //fb  graph.facebook.com/10152380678997793/picture?type=large
                console.log('fb');
                $('.sm-pp').attr('style', 'background-image: url("http://graph.facebook.com/'+userObj.linked_account_id+'/picture?type=large");');
                $('.sm-pp').attr('test', 'test');
              } else if (userObj.linked_account_type == 1) {
                tmpImg = 'http://pbs.twimg.com/profile_images/'+userObj.linked_account_id+'/avatar_small_bigger.png';
                console.log(tmpImg);
                $('.sm-pp').attr('style', 'background-image: url("'+tmpImg+'");');
              }
            }
          }

          squad_db.getData(function(data){
            squad_dict = data;

            $('#so-fav-team').html(squad_dict[userObj.team_id].name);
            $('#so-fav-team').attr('data-id', userObj.team_id);

            var teamList = '';
            $(squad_dict).each(function(index, obj){
              if (obj) {
                teamList += '<div class="so-tl-team" data-id='+obj.id+'><div class="so-tl-badge" style="background-image:url(img/' + obj.slug + '_large_nf.png);"></div><div class="so-tl-name">' + obj.name + '</div></div>';
              }
            });

            $('.so-select-team-content').html(teamList);
            teamList = '';

            $('.so-select-team-content .so-tl-team').on(clickEvent, function() {
              var newFav = parseInt($(this).attr('data-id'));
              console.log(newFav);
              rest.post('user/update-team/' + userObj.id, {'team_id': newFav}).done(function() {
                user.setNewTeam(newFav, squad_dict[newFav].slug, true);
                $('.so-select-team-content').slideToggle(400, function() {$('.so-select-team-wrapper').removeClass('active');});
                userObj = user.getUser();
                $('#so-fav-team').html(squad_dict[userObj.team_id].name);
                $('#so-fav-team').attr('data-id', userObj.team_id);
                // $('body').attr('style', 'background-image:url("img/bgs/' + squad_dict[userObj.team_id].slug +'.png");');
                // window.cache.clear( function() {}, function() {} );
                // window.location.reload();
              }).fail(function() {
                $('.so-select-team-content').slideToggle(400, function() {$('.so-select-team-wrapper').removeClass('active');});
              });
            });
            
          });

          var el;

          var preventScroll = function(e) {
            e.preventDefault();
          }

          var interval;

          var noScroll = function() {
            el = $('.content.ui-page-active');
            if (el.hasClass('fade')) {
              el.removeClass('fade');
              el.removeClass('out');
              el.addClass('ui-page-active');
            }

            var checkActive = function() {
              // console.log("checking");
              if (el.hasClass('fade')) {
                el.removeClass('fade');
                el.removeClass('out');
                el.addClass('ui-page-active');
                clearInterval(interval);
              }
              if (!el.hasClass('ui-page-active')) {
                el.addClass('ui-page-active');
                clearInterval(interval);
              }
            }
            interval = setInterval(checkActive, 100);

            // console.log('noScroll');
            // console.log(el);
            // $('body').bind('touchmove', preventScroll);
          }

          var yesScroll = function() {
            // $('body').unbind('touchmove', preventScroll);
            // console.log('yesScroll');
            // console.log(el);
            clearInterval(interval);
            el.addClass('ui-page-active');
            // console.log(el);
            //$('body').bind('touchmove', function(e){e.preventDefault()});
          }

          require(["jquery"], function(){
            $('#side-menu-link').sidr({
              name: 'sidemenu',
              side: 'left', // By default
              onOpen: noScroll,
              onClose: yesScroll
            });
          });


          //console.log("panel loaded");
          $(".sm-username").html(userObj.first_name + " " + userObj.last_name);
          if ($('.sm-overlay').data('pagetype') == "tnc") {
            $('#sm-b-tnc').addClass('active');
          }
          if ($('.sm-overlay').data('pagetype') == "dashboard") {
            $('#sm-b-db').addClass('active');
          }
          $('.sm-overlay').on(clickEvent, function() {
            //console.log("clicked overlay");
            $.sidr('close', 'sidemenu');
          });

          $('.h-menu-back').on(clickEvent, function(){
            $.sidr('close', 'sidemenu');
          });

          $("#sm-b-signout").on(clickEvent, function(e) {
            e.preventDefault();
            user.logout();
          });

          $('.sm-btn-extend .sm-button').on(clickEvent, function(){
            console.log("extend")
            var alreadyActive = false;
            $el = $(this).parent().find('.sm-button-content');
            if ($el.hasClass('active')) {
              alreadyActive = true;
            }

            if (!alreadyActive) {
              $el.addClass('active');
              $(this).addClass('active');
              $el.slideToggle();
            } else {
              $el.removeClass('active');
              $(this).removeClass('active');
              $el.slideToggle();
            }
          });

          if (userObj.push_notification || typeof userObj.push_notification === 'undefined') {
            $('#push_notif_slider').removeClass('off');
          } else {
            $('#push_notif_slider').addClass('off');
          }

          $('#so-pn').html($('#push_notif_slider').hasClass('off') ? 'off' : 'on');

          var switchNotif = function() {
            var pn = true;
            if ($('#push_notif_slider').hasClass('off')) {
              pn = false;
            }
            $('#push_notif_slider').toggleClass('off');
            pn = !pn;
            $('#so-pn').html(pn ? 'on' : 'off');
            rest.post('user/update-pn/' + userObj.id, {'push_notification': (pn ? 1 : 0)}).done(function() {
              user.setPN(pn);
            }).fail(function() {

            });
          }

          $('#push_notif_slider').on(clickEvent, function() {
            switchNotif();
          });

          $('.slider-ball').on(clickEvent, function() {
            switchNotif();
          });

          $('.so-select-team').on(clickEvent, function() {
            var alreadyActive = false;
            $el = $(this).parent();
            $el2 = $(this).parent().find('.so-select-team-content');
            if ($el.hasClass('active')) {
              alreadyActive = true;
            }

            if (!alreadyActive) {
              $el.addClass('active');
              $el2.slideToggle();
            } else {
              $el2.slideToggle(400, function() {$el.removeClass('active');});
            }
          });

          $('#sm-b-tell').on(clickEvent, function() {
            window.plugins.socialsharing.share('I\'ve joined StaRating. We\'re bringing power back to the fans. Head to www.starating.net to have your say.');
          });

        }, "html");
      //});
    }
  };

  return panel;

});
