const { withPodfile } = require('expo/config-plugins');

/**
 * Google Sign-In Swift pods (AppCheckCore) need module maps when linked statically.
 * @see https://github.com/react-native-google-signin/google-signin/issues
 */
function withIosModularHeaders(config) {
  return withPodfile(config, (podfileConfig) => {
    if (!podfileConfig.modResults.contents.includes('use_modular_headers!')) {
      podfileConfig.modResults.contents = podfileConfig.modResults.contents.replace(
        'prepare_react_native_project!',
        "use_modular_headers!\n\nprepare_react_native_project!",
      );
    }
    return podfileConfig;
  });
}

module.exports = withIosModularHeaders;
