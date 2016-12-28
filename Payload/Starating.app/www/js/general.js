define(['jquery', 'rest'], function ($, rest) {
  var generalContainer = '.general-container';
  var clickEvent = ('ontouchstart' in window ? 'tap2' : 'click');

  var general = {
    init: function(){
      if ($(generalContainer).length == 0) {
        $('body').prepend('<div class="general-container"></div>');
      }

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

      $('body .bn-button').off();
      $('body .bn-button').on(clickEvent, function(e) {
        e.preventDefault();
        window.location.href = $(this).attr('href');
      });

      // FOR ANDROID ONLY
      // // $('body').off(clickEvent, 'a');
      if (!rest.isIOS) {
        $('body').on(clickEvent, 'a', function(e) {
          var attr = $(this).attr('href');
          if (typeof attr !== typeof undefined && attr !== false && attr.length > 1) {
            e.preventDefault();
            window.location.href = $(this).attr('href');
          }
        });
      }
    },

    showNoInternet: function() {
      if ($(generalContainer).length == 0) {
        general.init();
      }
      if ($(generalContainer+' .no-internet').length == 0) {
        var el = '<div class="no-internet">';
        el += '<div class="swipe-bar" style="position: absolute !important;"></div>';
        el += '<div class="g-message-title">Network out of play</div>';
        el += '<div class="g-message-subtitle">Try again when your signal\'s back onside.</div>';
        el += '<div class="dash-divider"></div>';
        el += '<div class="icon-error"></div>';
        el += '</div>';
        $(generalContainer).append(el);
      }
      $('.content').hide();
      $('#swipe-content').hide();
      $('.spinner-overlay').hide();
      $(generalContainer+' .no-internet').fadeIn();
    },

    showLoader: function() {
      if ($(generalContainer).length == 0) {
        general.init();
      }
      if ($(generalContainer+' .loader').length == 0) {
        var el = '<div class="g-hidden loader g-overlay">';
        el += '<div class="g-hidden g-message-title">Steady build up play</div>';
        el += '<div class="g-hidden g-message-subtitle">Loading match info. Won\'t be a moment.</div>';
        el += '<div class="g-hidden dash-divider"></div>';
        el += '<div class="icon-loader icon-middle"></div>';
        el += '</div>';
        $(generalContainer).append(el);
      }
      $(generalContainer+' .loader').fadeIn();
    },

    showLoaderMessage: function() {
      if ($(generalContainer).length == 0) {
        general.init();
      }
      if ($(generalContainer+' .loader').length == 0) {
        general.showLoader();
      }
      
      $(generalContainer).addClass('g-blocker');
      $(generalContainer+' .loader .g-message-title').show();
      $(generalContainer+' .loader .g-message-subtitle').show();
      $(generalContainer+' .loader .dash-divider').show();
      $(generalContainer+' .loader .icon-loader').removeClass('icon-middle');
    },

    hideLoader: function() {
      if ($(generalContainer).length == 0) {
        general.init();
      }
      if ($(generalContainer+' .loader').length) {
        $(generalContainer+' .loader').fadeOut();
        $(generalContainer).fadeOut();
        $(generalContainer).removeClass('g-blocker');
      }
    }
  
  };

  return general;

});
