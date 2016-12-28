define(['jquery', 'rest'], function ($, rest) {

  var gImageURI = '';
  var gFileSystem = {};
  var url1, url2;
  var slug;
  var outFilePath;
  var doReload = false;

  var FileIO = {

    init: function(s, dr) {
      if (s) {
        slug = s;
      } else {
        slug = null;
      }
      if (dr && dr === true) {
        doReload = true;
      }
      console.log("dr - " + doReload);
      if (typeof LocalFileSystem !== 'undefined') {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, FileIO.gotFS, FileIO.errorHandler);  
      } else {
        return;
      }
      
    },
             
    // sets the filesystem to the global var gFileSystem
    gotFS : function(fileSystem) {
      gFileSystem = fileSystem;
      console.log(gFileSystem);
      if (slug) {
        FileIO.setFav(slug);
      }
    },

    setFav:function(slug) {
      console.log(cordova.file.applicationDirectory);
      console.log(cordova.file.dataDirectory);
      console.log(slug);
      // alert(cordova.file.dataDirectory);
      if (rest.isIOS) {
        console.log("ios");
        window.resolveLocalFileSystemURL(cordova.file.applicationDirectory+'www/img/bgs/'+slug+'.png',FileIO.onGetFileWin,FileIO.onGetFileFail);
      } else {
        console.log("android");
        /* FOR ANDROID ONLY */
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory+'www/img/bgs/'+slug+'.png',FileIO.onGetFileWin,FileIO.onGetFileFail);
      }
    },

    onGetFileWin:function(fileEntry) {
      console.log("got the file");
      // alert("got the file");
      //dataDir1 = gFileSystem.root.getDirectory("img", {create: false});
      url1 = fileEntry;
      // window.resolveLocalFileSystemURL(cordova.file.applicationDirectory+'www/img/',FileIO.onGetFileWin2,FileIO.onGetFileFail);
      if (cordova.file.documentsDirectory) {
        outFilePath = cordova.file.documentsDirectory+'/NoCloud/';
      } else {
        outFilePath = cordova.file.dataDirectory;
      }
      window.resolveLocalFileSystemURL(outFilePath,FileIO.onGetFileWin2,FileIO.onGetFileFail);
      // fileEntry.copyTo(cordova.file.applicationDirectory+'www/img/bgs/chelsea.png', "favbg.png", FileIO.success, FileIO.errorHandler);
    },

    onGetFileWin2:function(fileEntry) {
      console.log("got the folder");
      // alert("got the folder");
      url2 = fileEntry;
      // window.resolveLocalFileSystemURL(cordova.file.applicationDirectory+'www/img/favbg.png',FileIO.onGetFileWin3,FileIO.favbgNonexistent);
      window.resolveLocalFileSystemURL(outFilePath+'/favbg.png',FileIO.onGetFileWin3,FileIO.favbgNonexistent);
      // url1.copyTo(fileEntry, "favbg2.png", FileIO.success, FileIO.errorHandler);
    },

    onGetFileWin3:function(fileEntry) {
      console.log("got the existent favbg");
      // alert("got the existent favbg");
      fileEntry.remove(FileIO.onGetFileWin4, FileIO.favbgNonexistent);
    },

    onGetFileWin4:function(fileEntry) {
      console.log("removed the existent favbg");
      // alert("removed the existent favbg");
      url1.copyTo(url2, "favbg.png", FileIO.success, FileIO.errorHandler);
    },

    onGetFileFail:function(e) {
      console.log("failed to get file");
      console.log(e);
      // alert("failed to get file");
      // alert(e);
    },

    favbgNonexistent:function(e) {
      FileIO.onGetFileWin4();
    },

    success:function() {
      console.log("copied the file");
      // alert("copied file");
      if (doReload) {
        window.location.reload();
      }
    },
     
    // simple error handler
    errorHandler : function(e) {
      var msg = '';
      switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
               msg = 'QUOTA_EXCEEDED_ERR';
               break;
        case FileError.NOT_FOUND_ERR:
               msg = 'NOT_FOUND_ERR';
               break;
        case FileError.SECURITY_ERR:
               msg = 'SECURITY_ERR';
               break;
        case FileError.INVALID_MODIFICATION_ERR:
               msg = 'INVALID_MODIFICATION_ERR';
               break;
        case FileError.INVALID_STATE_ERR:
               msg = 'INVALID_STATE_ERR';
               break;
        default:
               msg = e.code;
        break;
      };
      console.log('Error: ' + msg);
      console.log(e);
    }
  };

  return FileIO;

});
