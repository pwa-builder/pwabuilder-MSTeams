////////////////////////////////
//*Platform.js
//*you might not need to make changes in this file.  If you follow the following conventions, no changes are nessecarry
//*   1. Your managing the manifest transformations inside of manifest.js.  Follow required steps
//*   2. Your Validating via the validation rules like this example
//*   3. You require images which sizes are defined in constants.js
//*   4. You are converting from JSON to JSON, if converting to XML or some other markup, see the comments and exmaple inline
//*      around line 93 you'll want to adjust the name of the file you are generating
//*   5. Your not moving any additional files into the platform folder, if so, see the comments and example inline
//*      see line 97 in the code for an example of how to do that.
//*     
///////////////////////////////
'use strict';

var path = require('path'),
    url = require('url'),
    util = require('util');
    
var Q = require('q');

var manifoldjsLib = require('pwabuilder-lib');

var PlatformBase = manifoldjsLib.PlatformBase,
    manifestTools = manifoldjsLib.manifestTools,
    CustomError = manifoldjsLib.CustomError,
    fileTools = manifoldjsLib.fileTools,
    iconTools = manifoldjsLib.iconTools;

var constants = require('./constants'),
    manifest = require('./manifest');
   
function Platform (packageName, platforms) {

  var self = this;

  PlatformBase.call(this, constants.platform.id, constants.platform.name, packageName, __dirname);

  // save platform list
  self.platforms = platforms;

  // override create function
  self.create = function (w3cManifestInfo, rootDir, options, callback) {

    self.info('Generating the ' + constants.platform.name + ' app...');
    
    var platformDir = path.join(rootDir, constants.platform.id);
    
    // convert the W3C manifest to a platform-specific manifest
    var platformManifestInfo;
    return manifest.convertFromBase(w3cManifestInfo)
      // if the platform dir doesn't exist, create it
      .then(function (manifestInfo) {
        platformManifestInfo = manifestInfo;         
        self.debug('Creating the ' + constants.platform.name + ' app folder...');
        return fileTools.mkdirp(platformDir);
      })
      // download icons to the app's folder
      .then(function () {
        return self.downloadIcons(platformManifestInfo.content, w3cManifestInfo.content.start_url, platformDir);
      })
      // copy the documentation
      .then(function () {
        return self.copyDocumentation(platformDir);
      })      
      // write generation info (telemetry)
      .then(function () {
        return self.writeGenerationInfo(w3cManifestInfo, platformDir);
      })
      // persist the platform-specific manifest
      .then(function () {
        self.debug('Copying the ' + constants.platform.name + ' manifest to the app folder...');
        //this is assuming that your manifest is named manifest.json, if it's xml call it manifest.xml, or call it whatever you want
        var manifestFilePath = path.join(platformDir, 'manifest.json');
        
        return manifestTools.writeToFile(platformManifestInfo, manifestFilePath);
      })
      //this is an example of how you can copy additional items to the project other than images and manifest
      //uncomment this code out and alter to meet your needs
    //   .then(function () {
    //     var assetsDir = path.join(self.baseDir, 'assets');
    //     var platformDir = path.join(rootDir, constants.platform.id);
    //     var manifestDir = path.join(platformDir, 'manifest');
    //     var fileName = 'msapp-error.html';
    //     var source = path.join(assetsDir, fileName);
    //     var target = path.join(manifestDir, fileName);
    //     self.info('Copying offline file "' + fileName + '" to target: ' + target + '...');
    //     return fileTools.copyFile(source, target);        
    //   })
      .nodeify(callback);
  };
}

util.inherits(Platform, PlatformBase);

module.exports = Platform;
