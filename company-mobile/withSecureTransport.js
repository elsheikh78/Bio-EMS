const { withAndroidManifest, withInfoPlist } = require("expo/config-plugins");

module.exports = function withSecureTransport(config) {
  config = withAndroidManifest(config, (result) => {
    result.modResults.manifest.application[0].$[
      "android:usesCleartextTraffic"
    ] = "false";
    return result;
  });
  return withInfoPlist(config, (result) => {
    result.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: false,
    };
    return result;
  });
};
