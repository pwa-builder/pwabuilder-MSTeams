'use strict';

var url = require('url'),
    Q = require('q');
var lib = require('pwabuilder-lib');
var utils = lib.utils;


// here is your base funcion, called by platform.js
//the idea here is to handle any transformations from the W3C manifest to your platform Manifest
function convertFromBase(manifestInfo, callback) {

//check to make sure you have a manifest before you try to transform it
  if (!manifestInfo || !manifestInfo.content) {
    return Q.reject(new Error('Manifest content is empty or not initialized.')).nodeify(callback);
  }

 //good to have a local ref to work with.  You'll see that you work work off of manifestInfo.content in platform.js
  var originalManifest = manifestInfo.content;


//here we are going to convert the W3C manifest to our strawman app
//note that you might need to re-map some values, or add some new ones
  var manifest = {
    '$schema': 'https://developer.microsoft.com/en-us/json-schemas/teams/v1.5/MicrosoftTeams.schema.json',
    'manifestVersion': '1.5',
    'version': '1.0.0',
    'id': utils.newGuid(),
    'name': {
        'short': originalManifest.short_name || 'TODO: Enter short name (30 characters or less)',
        'full': originalManifest.name || ''
    },
    'description': {
        'short': originalManifest.short_description || 'TODO: Enter short description (80 characters or less)',
        'full': originalManifest.long_description || 'TODO: Enter full description (4000 characters or less)'
    },
    'developer': {
        'name': originalManifest.developer_name || 'TODO: Enter developer name',
        'websiteUrl': originalManifest.start_url || 'TODO: Enter website url',
        'privacyUrl': originalManifest.privacyUrl || 'TODO: Enter privacy url',
        'termsOfUseUrl': originalManifest.termsOfUseUrl || 'TODO: Enter terms of use url'
    },
    'configurableTabs': [
              {
                  'configurationUrl': originalManifest.start_url || 'TODO: Enter webpage URL',
                  'canUpdateConfiguration': true,
                  'scopes': [
                      'team',
                      'groupchat'
                  ]
              }
          ],
    'permissions': ['identity', 'messageTeamMembers'],
    'validDomains': [
        url.parse(originalManifest.start_url).hostname
    ]
  };

  // Create package name (reverse URL domain)
  var packageName = '';
  if (originalManifest.start_url && originalManifest.start_url.length) {
    var hostnameArray = url.parse(originalManifest.start_url).hostname.split('.');
    for (var i = hostnameArray.length - 1; i > 0; i--) {
        packageName = packageName + hostnameArray[i] + '.';
    }
    packageName = packageName + hostnameArray[0];
    manifest.packageName = packageName;
  } else {
    manifest.packageName = 'TODO: Enter package name. Ex: "com.microsoft.teams.devapp"';
  }

  // Select optional accent color (must be in hex format; ex: #FFFFFF)
  if (originalManifest.theme_color && originalManifest.theme_color[0] === '#') {
    manifest.accentColor = originalManifest.theme_color;
  } else if (originalManifest.background_color && originalManifest.background_color[0] === '#') {
    manifest.accentColor = originalManifest.background_color;
  }

  // Here's a pretty standard practice of mapping the icons from the W3C to the manifest object you pass back to platform.js
  //if you don't use images in your platform, delete this stuff
  if (originalManifest.icons && originalManifest.icons.length) {
    var icons = {};
    for (var j = 0; j < originalManifest.icons.length; j++) {
      var icon = originalManifest.icons[j];
      var size = ['32x32', '192x192'].indexOf(icon.sizes); //specify which size icons from manifest to keep
      if(size >=0){
          if (icon.sizes == '32x32') {
            icons.outline = icon.src;
          } else if (icon.sizes == '192x192') {
            icons.color = icon.src;
          }
      }
    }
    manifest.icons = icons;
  }

  // NOTE: you may need to map permissions in this file as well, if your app supports permissions, pull them from
  //originalManifest.mjs_api_access

//This is important, this will be converted into a file that lives on your project root.  Manifoldjs uses it, and it's a good record
//to have around, so make sure you leave this.  Add extra info to it if you think it would be handy
  var convertedManifestInfo = {
    'content': manifest,
    'format': lib.constants.STRAWMAN_MANIFEST_FORMAT
  };
  //this is the return, that's all she wrote!
  return Q.resolve(convertedManifestInfo).nodeify(callback);
}

module.exports = {
  convertFromBase: convertFromBase
};
