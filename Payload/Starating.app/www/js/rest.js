define(['jquery'], function ($) {
  //var base = 'http://162.13.45.102/';
  // var base = 'http://localhost:8000/';
  //var base = 'http://162.13.45.102/starating/StaRatingAPI/public/';
  //var base = 'http://localhost/starating/starating/StaRatingAPI/public/';
  var base = 'http://starating.net/starating_league2015/StaRatingAPI/public/';
  //squad/getGlobal

  var rest = {
      isIOS: true,

      get: function(slug, data){
       return  $.get(base + slug);
      },

      post: function(slug, data){
       return $.post(base + slug, data);
     },
  };

  return rest;

});

