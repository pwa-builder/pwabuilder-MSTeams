'use strict';

var manifoldjsLib = require('pwabuilder-lib');

var validationConstants = manifoldjsLib.constants.validation,
    imageValidation =  manifoldjsLib.manifestTools.imageValidation;

    module.exports = function (manifestContent, callback) {
        if (!manifestContent.developer && !manifestContent.packageName && !manifestContent.developer.privacyUrl && !manifestContent.developer.termsOfUseUrl) {
            callback(undefined, {
                'description': 'A the developer object requires some additional information',
                'platform': validationConstants.platforms.all,
                'level': validationConstants.levels.warning,
                'member': validationConstants.manifestMembers.short_name,
                'code': validationConstants.codes.requiredValue
            })
        }

        callback();
    }