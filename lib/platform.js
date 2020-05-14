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

var fs = require('fs');
var archiver = require('archiver');

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
  self.create = function (w3cManifestInfo, rootDir, options, href, callback) {

    self.info('Generating the ' + constants.platform.name + ' app...');
    
    var platformDir = self.getOutputFolder(rootDir);
    var manifestDir = path.join(platformDir, 'manifest');
    var imagesDir = path.join(manifestDir, 'images');

    // convert the W3C manifest to a platform-specific manifest
    var platformManifestInfo;
    return manifest.convertFromBase(w3cManifestInfo, msTeamsSchemaParams)
      // if the platform dir doesn't exist, create it
      .then(function (manifestInfo) {
        platformManifestInfo = manifestInfo;

        // Load passed json string parameter as
        try {
          var msTeamsSchemaParams = options && options.schema && options.schema.mstemas && JSON.parse(options.schema.msteams);

          platformManifestInfo.packageName = msTeamsSchemaParams.name; // package name
          //platformManifestInfo.<> = msTeamsSchemaParams.description //(not sure which one this maps to.)
          platformManifestInfo.privacyUrl = msTeamsSchemaParams.privacyUrl;
          platformManifestInfo.termsOfUseUrl = msTeamsSchemaParams.termsOfUseUrl;
        } (e) {}

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
        return self.downloadIcons(platformManifestInfo.content, w3cManifestInfo.content.start_url, imagesDir);
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
        var manifestFilePath = path.join(manifestDir, 'manifest.json');
        
        return manifestTools.writeToFile(platformManifestInfo, manifestFilePath);
      })
      
      // create zip file
      .then(function() {
        // create a file to stream archive data to.
      var output = fs.createWriteStream(platformDir + '/manifest.zip');
      var archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
      });
 
      // listen for all archive data to be written
      // 'close' event is fired only when a file descriptor is involved
      output.on('close', function() {
        self.debug(archive.pointer() + ' total bytes');
        self.debug('archiver has been finalized and the output file descriptor has closed.');
      });
 
      // This event is fired when the data source is drained no matter what was the data source.
      // It is not part of this library but rather from the NodeJS Stream API.
      // @see: https://nodejs.org/api/stream.html#stream_event_end
      output.on('end', function() {
        self.debug('Data has been drained');
      });
 
      // good practice to catch warnings (ie stat failures and other non-blocking errors)
      archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
          self.debug('archiver error: ENOENT');
        } else {
          self.debug('archiver throw error');
          throw err;
        }
      });
 
      // good practice to catch this error explicitly
      archive.on('error', function(err) {
        self.debug('archiver catch error');
        throw err;
      });
 
      // pipe archive data to the file
      archive.pipe(output);
 
      // append a file from stream
      var file1 = manifestDir + '/manifest.json';
      archive.append(fs.createReadStream(file1), { name: 'manifest.json' });
    
      // append a file from string
      archive.append('string cheese!', { name: 'file2.txt' });

      // append files from a sub-directory and naming it `new-subdir` within the archive
      archive.directory(imagesDir, 'images');
    
      // finalize the archive (ie we are done appending files but streams have to finish yet)
      // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();
        self.debug('archiver done and placed in' + platformDir);
      })

      .nodeify(callback);
  };
}

util.inherits(Platform, PlatformBase);

module.exports = Platform;
