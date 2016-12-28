define(['jquery', 'user', 'parsley'], function ($, user, parsley) {
   $( document ).ready(function() {
     $('#register-form').on('submit', function(e){
       e.preventDefault();
       if($('#register-form').parsley().validate()){
         user.register();
       }
     });
     $('.header-back').on('click', function(e) {
      window.history.back();
     });
   });

  var reg = {

  };

  return reg;

});
