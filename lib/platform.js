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
var msteamsUtils = require('./msteams-utils');
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
    return manifest.convertFromBase(w3cManifestInfo)
      // if the platform dir doesn't exist, create it
      .then(function (manifestInfo) {
        platformManifestInfo = manifestInfo;
        msteamsUtils.parseMsTeamsSchema(options, platformManifestInfo);

        self.debug('Creating the ' + constants.platform.name + ' app folder...');
        return fileTools.mkdirp(platformDir);
      })
      // if the manifest dir doesn't exist, create it
      .then(function (manifestInfo) {
        self.debug('Creating the ' + manifestDir + 'directory... ');
        return fileTools.mkdirp(manifestDir);
      })
      // create the images dir folder
      .then(function () {
        return fileTools.mkdirp(imagesDir);
      })
      // download icons to the app's folder
      .then(function () {
        return self.downloadIcons(platformManifestInfo.content, w3cManifestInfo.content.start_url, imagesDir);
      })
      // Flatten the images directory structure
      .then(function () {
        self.debug('flattening the images folder');
        return fileTools.flattenFolderStructure(imagesDir, imagesDir);
      })
      // copy the documentation
      .then(function () {
        self.debug('copy documentation');
        return self.copyDocumentation(platformDir);
      })
      // write generation info (telemetry)
      .then(function () {
        self.debug('write generation info');
        return self.writeGenerationInfo(w3cManifestInfo, platformDir);
      })
      // persist the platform-specific manifest
      .then(function () {
        self.debug('platform content icons color = ' + platformManifestInfo.content.icons.color);
        msteamsUtils.resolveImagePaths(platformManifestInfo, rootDir, imagesDir);

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

  /*
    Overwritten downloadIcons
      Follows the same path as the manifest, works with the outputManifest to determine which icons need to be downloaded, but refers to the originalManifest to do the rest.
      Use original manifest to keep the type of the
  */
  self.downloadIcons = function (originalManifest, outputManifest, baseUrl, imagesOutputInfo, callback) {
    self.debug('Downloading the ' + self.id + ' icons...');

    // defaults for images output folder and manifest icons' path updates
    var rootDir = imagesOutputInfo;
    var imagesDir = imagesOutputInfo;
    var relativePath = '';
    var updatePaths = false;

    // if the imagesOutputInfo is object with content
    if (imagesOutputInfo.rootFolder) {
      self.debug('Overriding defaults with custom images info: ' + JSON.stringify(imagesOutputInfo));

      rootDir = imagesOutputInfo.rootFolder;
      imagesDir = imagesOutputInfo.outputFolder;
      relativePath = imagesOutputInfo.relativePath;
      updatePaths = imagesOutputInfo.updatePaths;
    }

    // download the icons specified in the manifest
    var iconList = originalManifest.icons;
    self.debug("icons: " + JSON.stringify(iconList));
    return Q.resolve().then(function () {
      if (iconList) {
        var icons = self.getManifestIcons(originalManifest, outputManifest);
        self.debug("icons: " + JSON.stringify(icons));

        var downloadTasks = icons.map(function(icon) {
          self.debug("icon: " + JSON.stringify(icon));

          var isDataUri = new RegExp('^' + constants.IMG_GEN_OUT_DATAURI);
          if (self.getEmbeddedIconUri(originalManifest, icon).match(isDataUri)) {
            return self.resolveEmbeddedIcon(originalManifest, outputManifest, icon, rootDir, imagesDir);
          }

          var iconPath = icon.url || icon;
          var iconUrl = url.resolve(baseUrl, iconPath);
          var pathname = icon.fileName || url.parse(iconUrl).pathname;
          var iconFilePath = path.join(imagesDir, pathname);
          return iconTools.getIcon(iconUrl, iconFilePath);
        });

        return Q.allSettled(downloadTasks).then(function (results) {
          results.forEach(function (result) {
            if (result.state === 'rejected') {
              self.warn('Error downloading an icon file. ' + result.reason.message);
            }
          });
        });
      }
    }).then(function () { // copy default platform icons to replace any missing icons
      // if the platform provided the input w3c manifest then remove it as it's no longer needed
      delete(originalManifest.__w3cManifestInfo);

      var defaultImagesDir = path.join(self.baseDir, 'assets', 'images');
      return fileTools.syncFiles(defaultImagesDir, imagesDir, {
        // filter out default images that do not need to be moved over
        filter: function (file) {
          // determine the icon dimensions assuming a convention where
          // the file name specifies the icon's size (e.g. '50x50.png')
          var size = path.basename(file, path.extname(file));
          return !self.getManifestIcon(originalManifest, size);
        }
      }).then(function (files) {
        files.forEach(function (file) {
          // make path relative to imagesDir
          var filePath = path.relative(imagesDir, file);

          // convention is for file name to specify the icon's size
          var size = path.basename(file, path.extname(file));
          self.addManifestIcon(outputManifest, filePath, size);
        });
      })
      .catch(function (err) {
        if (err.code !== 'ENOENT') {
          return Q.reject(err);
        }

        self.debug('No default icons were found to copy for the \'' + self.id + '\' platform.');
      });
    }).then(function() {
      if (!updatePaths) { return; }

      return self.updateManifestIconsPaths(outputManifest, relativePath);
    }).nodeify(callback);
  }

  /*
    using the resources of the original manifest, fetches file, preserves path, and then modifies the entry into the outputManifest
  */
  self.resolveEmbeddedIcon = function(originalManifest, outputManifest, iconFromGetManifestIcons, rootDir, imagesDir, callback) {
    self.debug('resolveEmbeddedIcon() - iconFromGetManifestIcons: ' + JSON.stringify(iconFromGetManifestIcons));

    self.debug('Getting embedded icon from ' + self.getEmbeddedIconUri(originalManifest, iconFromGetManifestIcons).substr(0, 50) + '...');

    var targetFilename = self.getEmbeddedIconFilename(originalManifest, iconFromGetManifestIcons);
    var outputFilename = path.join(imagesDir, targetFilename);
    return fileTools.mkdirp(path.dirname(outputFilename)).then(function() {
      var image = new Buffer(
        self.getEmbeddedIconUri(originalManifest, iconFromGetManifestIcons).replace(constants.IMG_GEN_OUT_DATAURI, ''),
        'base64');

      self.debug('Writing embedded icon file to ' + outputFilename);
      return Q.nfcall(fs.writeFile, outputFilename, image).then(function() {
        return self.updateEmbeddedIconUri(outputManifest, iconFromGetManifestIcons, url.parse(targetFilename).pathname);
      });
    }).nodeify(callback);
  };

  /*
    getManifestIcons
    Overwritten because the outputManifest determines the keys, but the originalManifest provides the context object required to parse.
   */
  self.getManifestIcons = function (originalManifest, outputManifest) {
    return Object.keys(outputManifest.icons || {}).map(function (size) { return originalManifest.icons[size]; });
  };
}

util.inherits(Platform, PlatformBase);

module.exports = Platform;
