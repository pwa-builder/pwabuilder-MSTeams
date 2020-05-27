var fs = require('fs');
var path = require('path');
var sizeOf = require('image-size');

function parseMsTeamsSchema(options, manifest) {
  // Load passed json string parameter into the manifest
  // TODO: Add documentation on options parameter format
  try {
    var schema = options && options.schema && JSON.parse(options.schema);
    var msTeamsSchemaParams = schema && schema.msteams;

    manifest.content.developer.name = msTeamsSchemaParams.publisherName;
    manifest.content.description.full = msTeamsSchemaParams.longDescription;
    manifest.content.description.short = msTeamsSchemaParams.shortDescription;
    manifest.content.developer.privacyUrl = msTeamsSchemaParams.privacyUrl;
    manifest.content.developer.termsOfUseUrl = msTeamsSchemaParams.termsOfUseUrl;
  } catch (e) { }
}

function resolveImagePaths(manifest, rootDir, imagesDir) {
  // check to see if the generated icons exist in the folder after flattening, rename those icons and use them as the manifest entries.
  if (!manifest.content.icons) {
    manifest.content.icons = {};
  }

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
      manifest.content.icons.color = path.relative(rootDir, generatedColorPath);
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
    manifest.content.icons.outline = path.relative(rootDir, generatedOutlinePath);
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
    manifest.content.icons.color = originalColorPath;
  } else {
    manifest.content.icons.color = "TODO: need to add image path here for an icon with a single solid color which corresponds to \"accentColor\"";
  }

  if (originalOutlinePath) {
    manifest.content.icons.outline = originalOutlinePath;
  } else {
    manifest.content.icons.outline = "TODO: need to add image path here for an icon with a transparent background, icon is silhouette is white (#ffffff).";
  }
}

module.exports = {
  parseMsTeamsSchema,
  resolveImagePaths,
};