define(['jquery', 'user', 'parsley', 'hello', 'rest'], function ($, user, parsely, hello, rest) {

  var FileIO;

   $( document ).ready(function() {
     $('#login-form').on('submit', function(e){
       e.preventDefault();
       if($('#login-form').parsley().validate()){
         user.login(FileIO);
       } else {
        /*if (navigator.notification) {
          navigator.notification.alert(
            'The e-mail or password you entered are incorrect. Please try again',  // message
            null,         // callback
            'Login failed',            // title
            'OK'                  // buttonName
          );
        } else {
          alert('The e-mail or password you entered are incorrect. Please try again');
        }*/
        console.log('login validation failed add handle');
      }
     });
     $('.header-back').on('click', function(e) {
      window.history.back();
     });
  });

  var login = {
    setFileIO: function(fio) {
      FileIO = fio;
    },
    socailAuthProcess: function(data){
      user.socialLogin();
    }
  };

  return login;

});
