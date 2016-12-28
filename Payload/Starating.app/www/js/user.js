define(['jquery', 'rest', 'file_controller'], function ($, rest, file_controller) {	
  var user = {
      getUser: function(){
        var loggedInUser = window.localStorage.getItem('user');
        console.log(JSON.parse('' + loggedInUser));
        return JSON.parse('' + loggedInUser);
      },
	  updateUserBG: function(){
		  if(this.getUser().team_id){
				tid = this.getUser().team_id;
				/*rest.get('squad/getTeam/'+tid,'').done(function(data){
					$("body").css("backgroundImage","url('img/bgs/"+data.slug+".png')");
				});*/
		  }
      },
	  getUserId: function(){
        var loggedInUser = window.localStorage.getItem('user');
        console.log(JSON.parse('' + loggedInUser));
        var user = JSON.parse('' + loggedInUser);
        if(user == 'undefined'){
          window.location.href = "login.html";
        }
        else{
          return user.id;
        }
      },

      getNotif1: function(){
        var notif1 = window.localStorage.getItem('notif1');
        return notif1;
      },

      setNotif1: function(n1){
        localStorage.setItem('notif1', n1);
      },

      // NOTIF 2 is for resetting match_DB
      getNotif2: function(){
        var notif2 = window.localStorage.getItem('notif2');
        return notif2;
      },

      setNotif2: function(n2){
        localStorage.setItem('notif2', n2);
      },

      // NOTIF 2 is for resetting match_DB
      getFav: function(){
        var fav = window.localStorage.getItem('fav');
        return fav;
      },

      setFav: function(n2){
        localStorage.setItem('fav', n2);
      },

      setPN: function(pn) {
        pn = (pn ? 1 : 0);
        localStorage.setItem('push_notification', pn);
        newUser = user.getUser();
        newUser.push_notification = pn;
        localStorage.setItem("user", JSON.stringify(newUser));
      },

      setNewTeam: function(tid, slug, doReload) {
        localStorage.setItem('favid', tid);
        newUser = user.getUser();
        newUser.team_id = tid;
        var dr = false;
        if (doReload && doReload === true) {
          dr = true;
        }
        console.log("dr - " + dr);
        file_controller.init(slug, dr);
        localStorage.setItem("user", JSON.stringify(newUser));
      },

      logout: function(){
        window.localStorage.clear();
        // window.cache.clear( function(s){alert('cleared cache');}, function(s){console.log("error clearing cache"); alert('error clearing cache');} );
        window.location.href = "index.html";
      },

      login: function(FileIO){
      var result =  rest.post('authentication', $('#login-form').serialize());
      result.done(function(r){
        console.log(r);
            if(r != 'false'){
              console.log('Authenticated User: ' + JSON.stringify(r));
              localStorage.setItem("user", JSON.stringify(r));
              localStorage.setItem("notif1", "0");
              localStorage.setItem("notif2", "1");
              if (FileIO) {
                tid = user.getUser().team_id;
                rest.get('squad/getTeam/'+tid,'').done(function(data){
                  if (cordova.file) {
                    FileIO.setFav(data.slug);
                  } else {
                    window.location.href = "dashboard.html";
                    // window.location.href = "onboard1.html";
                  }
                });
              } else {
                window.location.href = "dashboard.html";
                // window.location.href = "onboard1.html";
              }
            }
            else{
              //display error
              $('input.white-input').addClass('parsley-error');
              if (navigator.notification) {
                navigator.notification.alert(
                  'The e-mail or password you entered are incorrect. Please try again',  // message
                  null,         // callback
                  'Login failed',            // title
                  'OK'                  // buttonName
                );
              } else {
                alert('The e-mail or password you entered are incorrect. Please try again');
              }
            }
          });
      },

      checkAuth: function(redirect){
        user.getUser();
        if(user.getUser() && user.getUser().id !== 'undefined'){
          if (redirect) {
            window.location.href = "dashboard.html";
          }
          return true;
        }
        return false;
      },

      register: function(){
        var result = rest.post('register', $('#register-form').serialize());
        result.done(function(r){
          if(r == 0){
           /* var message = content = $('<p/>', {
                id: 'already-member-msg',
                class: 'error-state',
                text: 'You are already a member'
            });
            $('#register-message').append(message);*/
            $('#reg-email').addClass('parsley-error');
            if (navigator.notification) {
              navigator.notification.alert(
                'The e-mail you entered is already in use. If you\'re already registered go back and use log in.',  // message
                null,         // callback
                'Registration failed',            // title
                'OK'                  // buttonName
              );
            } else {
              alert('The e-mail you entered is already in use. If you\'re already registered go back and use log in.');
            }
            console.log('already registered'  + r);
          }else{
            console.log('Registered User' + r);
            localStorage.setItem("user", JSON.stringify(r));
            window.location.href = "team_selection.html";
          }
        });
      },

      setTeam: function(teamid, FileIO){
        var result = rest.post('misc/updateteampref/' + this.getUser().id, {'team_id': teamid});
		result.done(function(r){
          localStorage.setItem("user", JSON.stringify(r));
		  if (FileIO) {
            tid = user.getUser().team_id;
			rest.get('squad/getTeam/'+tid,'').done(function(data){
              if (cordova.file) {
                FileIO.setFav(data.slug);
              } else {
                // TO DO ONBOARDING
                // window.location.href = "register_share.html";
                // window.location.href = "dashboard.html";
                window.location.href = "onboard1.html";
              }
            });
          } else {
            // TO DO ONBOARDING
            // window.location.href = "register_share.html";
            // window.location.href = "dashboard.html";
            window.location.href = "onboard1.html";
          }
          
        });
      },

      getTeam: function() {
        tid = user.getUser().team_id;
        rest.get('squad/getTeam/'+tid,'').done(function(data){
          console.log(data.slug);
          return data.slug;
        });
        
      },

      supplyMissingTwitterInfo: function(data){
        console.log('ACCOUNT ID' +this.getUser().linked_account_id);
        var result = rest.post('misc/addtioninfomation/'+ this.getUser().linked_account_id, data);
        result.done(function(r){
          console.log('RETURN DATA'  +r);
          localStorage.setItem("user", JSON.stringify(r));
          window.location.href = "team_selection.html";
        });
      },

      socialLogin: function(data, FileIO){
        // alert('Stuff from social' + JSON.stringify(data));
        // if (data.error) {
          // return;
        // }
        console.log(localStorage);
        console.log('Stuff from social' + JSON.stringify(data));
        var result  = rest.post('social', data);
        result.done(function(r){
         // alert('returned from api: ' + JSON.stringify(r));
         console.log(localStorage);
          window.localStorage.setItem("user", JSON.stringify(r));
          console.log(localStorage);
          // tid = 
          console.log('about to hit window close');
          // window.close(); // NO NEED TO CALL CLOSE
          console.log('after dat shit to hit window close');
          if(r.is_registered == '1'){
            console.log('registered user: ' + JSON.stringify(r));
            // window.location.href = "dashboard.html";
            if (FileIO) {
              // tempUsr = JSON.parse('' + JSON.stringify(r));
              tempUsr = r;
              console.log(r);
              console.log(tempUsr);
              tid = tempUsr.team_id;
              // tid = user.getUser().team_id;
              rest.get('squad/getTeam/'+tid,'').done(function(data){
                if (cordova.file) {
                  console.log('setting fav');
                  console.log(localStorage);
                  FileIO.setFav(data.slug);
                } else {
                  window.location.href = "dashboard.html";
                }
              });
            } else {
              window.location.href = "dashboard.html"; 
            }
          }
          else{
            console.log('firtst time: ' + JSON.stringify(r));
            localStorage.setItem("user", JSON.stringify(r));
            console.log('NETWORK : ' + window.localStorage.getItem('network') );
            var net =  window.localStorage.getItem('network');
            if(net == 'twitter'){
            //  alert('socail info');
              // window.location.href = "social_addtional_info.html";
              window.location.href = "team_selection.html";
            }
            else{
             // alert('team selction info');
              window.location.href = "team_selection.html";
            }
          }
        });
      }
  };
	
	/* window.onload = function(){
		setTimeout(function(){
			alert("dfa");
			if(typeof user!="undefined"){
				user.updateUserBG();	
			}
			onLoad();
		},1000);		
	}; */
	$(document).ready(function(){
		setTimeout(function(){
			if(typeof user!="undefined"){
				user.updateUserBG();	
			}
		},1000);
	});
  return user;

});


