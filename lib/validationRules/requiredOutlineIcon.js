'use strict';

var manifoldjsLib = require('pwabuilder-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

var constants = require('../constants');

module.exports = function (manifestContent, callback) {
  var description = 'An icon of a white outline with dimensions 32x32 is required for the teams plug-in manifest',
  platform = constants.platform.id,
  level = validationConstants.levels.warning,
  requiredIconSizes = ['32x32'];

  imageValidation(manifestContent, description, platform, level, requiredIconSizes, callback);
};
