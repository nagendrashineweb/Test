define(['jquery', 'user', 'data_pull_processor', 'general','rest'], function ($, user, pullData, general,rest) {
  var isLoaded = false;
  var dashboard = {
    init: function(){
      if (window.localStorage.getItem('loadedStuff') && window.localStorage.getItem('loadedStuff') !== "") {
        if(dashboard.checkRecentPull()){
          // console.log("just refreshing");
          // setTimeout(function() { 
            // if ($('.spinner-overlay').data('display') == "0") { 
              // console.log("showing slow in refresh timeout"); 
              // $(".spinner-text").hide(); 
              // $(".spinner-text-nowebs").hide(); 
              // $('.spinner-text-slow').show();
            // } 
          // }, 4000);
          pullData.pullUpDataRefresh(dashboard.dataLoaded);
        }
      } else {
        // console.log("pulling everything");
        // $(".spinner-text-slow").hide();
        // $(".spinner-text").show();
        // SHOW PULL ALL MESSAGE
        general.showLoaderMessage();
        pullData.pullUpData(dashboard.dataLoaded);
      }

      $('.header-menu').on('click', function(e) {
  			//window.history.back();
  		});
    },
    dataLoaded: function() {
      isLoaded = true;
      //add entry into local storage 
      var d = new Date();
      localStorage.removeItem('pull');
      localStorage.setItem("pull", d.getTime());
      localStorage.removeItem('loadedStuff');
      localStorage.setItem("loadedStuff", d.getTime());
    },
    getLoaded: function() {
      return isLoaded;
    },
    checkRecentPull: function(){
      return true;
      //pull from local storage time of last pull and compare
      var lastPull = window.localStorage.getItem('pull');
      var current = new Date();
      var timeDiff = Math.abs(current.getTime() - lastPull);
      var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      console.log(timeDiff);
      console.log(diffDays);
      if(diffDays > 0)//insert number here
      {
       return true;
      }
       return false;
     }
  
  };

  return dashboard;

});
