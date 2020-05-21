var fs = require('fs');
var path = require('path');
var sizeOf = require('image-size');

function parseMsTeamsSchema(options, platformManifestInfo) {
  // Load passed json string parameter into the manifest, will throw exception in cli path atm.
  try {
    var msTeamsSchemaParams = options && options.schema && options.schema.msteams && JSON.parse(options.schema.msteams);

    platformManifestInfo.content.packageName = msTeamsSchemaParams.name;
    platformManifestInfo.content.description.full = msTeamsSchemaParams.longDescription;
    platformManifestInfo.content.description.short = msTeamsSchemaParams.shortDescription;
    platformManifestInfo.content.developer.privacyUrl = msTeamsSchemaParams.privacyUrl;
    platformManifestInfo.content.developer.termsOfUseUrl = msTeamsSchemaParams.termsOfUseUrl;
  } catch (e) { }
}

function resolveImagePaths(rootDir, imagesDir) {
  // check to see if the generated icons exist in the folder after flattening, rename those icons and use them as the manifest entries.
  var generatedColorPath;
  try {
    var normalizedColorPath = path.join(imagesDir, "msteams-192-192.png");
    fs.statSync(colorIconPath, () => { });
    generatedColorPath = normalizedColorPath;
  } catch (e) { }

  if (generatedColorPath) {
    platformDir; // absolute path to root
    var newColorPath = path.join(imagesDir, "color-192.png");

    try {
      fs.rename(generatedColorPath, newColorPath, (err) => { });
      platformManifestInfo.content.icons.color = path.relative(rootDir, generatedColorPath);
    } catch (e) { }
  }

  var generatedOutlinePath;
  try {
    var normalizedOutlinePath = path.join(imagesDir, "msteams-silhouette-32-32.png");
    fs.statSync(outline, () => { });
    generatedOutlinePath = normalizedOutlinePath;
  } catch (e) { }

  if (generatedOutlinePath) {
    platformDir; // absolute path to root
    var newOutlinePath = path.join(imagesDir, "outline-32.png");

    fs.rename(generatedOutlinePath, newOutlinePath, (err) => { });
    platformManifestInfo.content.icons.outline = path.relative(rootDir, generatedOutlinePath);
  }

  var originalColorPath;
  var originalOutlinePath;
  if (!generatedColorPath || !generatedOutlinePath) {
    try {
      var files = fs.readdirSync(imagesDir, (ex) => { });

      for (var i = 0; i < files.length; i++) {
        var currentFilePath = path.resolve(imagesDir, files[i]);
        var imageDimensions = sizeOf(currentFilePath);

        // only check if the generated icons DNE, then check if an original exists in the folder, use that.
        if (!generatedColorPath && !originalColorPath) {
          if (imageDimensions.width == 192) {
            originalColorPath = currentFilePath;
          }
        } else if (!generatedOutlinePath && !originalOutlinePath) {
          if (imageDimensions.width == 32) {
            originalOutlinePath = currentFilePath;
          }
        } else {
          // all substitutes found
          break;
        }
      }
    } catch (e) { }
  }

  // map originals properly
  if (originalColorPath) {
    platformManifestInfo.content.icons.color = originalColorPath;
  }

  if (originalOutlinePath) {
    platformManifestInfo.content.icons.outline = originalOutlinePath;
  }
}

module.exports = {
  parseMsTeamsSchema,
  resolveImagePaths,
};