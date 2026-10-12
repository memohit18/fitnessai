const { withPodfile } = require('expo/config-plugins');

/**
 * Google Sign-In Swift pods (AppCheckCore) need module maps when linked statically.
 * @see https://github.com/react-native-google-signin/google-signin/issues
 */
const DEPLOYMENT_TARGET_SNIPPET = `
    # Xcode 27+ requires a deployment target of at least 15.0.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < 15.0
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
        end
      end
    end`;

function withIosModularHeaders(config) {
  return withPodfile(config, (podfileConfig) => {
    let contents = podfileConfig.modResults.contents;
    if (!contents.includes('use_modular_headers!')) {
      contents = contents.replace(
        'prepare_react_native_project!',
        "use_modular_headers!\n\nprepare_react_native_project!",
      );
    }
    if (!contents.includes("IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'")) {
      contents = contents.replace(
        'ccache_enabled?(podfile_properties),\n    )\n',
        `ccache_enabled?(podfile_properties),\n    )\n${DEPLOYMENT_TARGET_SNIPPET}\n`,
      );
    }
    podfileConfig.modResults.contents = contents;
    return podfileConfig;
  });
}

module.exports = withIosModularHeaders;
