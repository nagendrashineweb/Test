define(['jquery', 'user', 'parsley'], function ($, user, parsley) {
   $( document ).ready(function() {
     $('#addtional-info-form').on('submit', function(e){
       e.preventDefault();
       if($('#addtional-info-form').parsley().validate()){
         user.supplyMissingTwitterInfo($('#addtional-info-form').serialize());
       }
     });
   });

  var socialInfo = {
    init: function(){
      var profile = $('<img/>', {
          id: 'user-profile-image',
          class: 'profile-image',
          src: user.getUser().profile_image
      });

      $('#profile-image-holder').append(profile);
    }
  };

  return socialInfo;

});
