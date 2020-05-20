function parseMsTeamsSchema(options, platformManifestInfo) {
  // Load passed json string parameter into the manifest, will throw exception in cli path atm.
  try {
    var msTeamsSchemaParams = options && options.schema && options.schema.msteams && JSON.parse(options.schema.msteams);

    platformManifestInfo.content.packageName = msTeamsSchemaParams.name;
    platformManifestInfo.content.description.full = msTeamsSchemaParams.longDescription;
    platformManifestInfo.content.description.short = msTeamsSchemaParams.shortDescription;
    platformManifestInfo.content.developer.privacyUrl = msTeamsSchemaParams.privacyUrl;
    platformManifestInfo.content.developer.termsOfUseUrl = msTeamsSchemaParams.termsOfUseUrl;
  } (e) {}
}

module.exports = {
  parseMsTeamsSchema
};