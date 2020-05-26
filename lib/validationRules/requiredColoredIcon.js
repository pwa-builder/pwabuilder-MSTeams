'use strict';

var manifoldjsLib = require('pwabuilder-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'An icon of a with a solid color background with dimensions 192x192 is required for the teams plug-in manifest',
  platform = constants.platform.id,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['192x192'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
