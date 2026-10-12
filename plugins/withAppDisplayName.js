const { withInfoPlist, withStringsXml, withXcodeProject } = require('expo/config-plugins');

const DISPLAY_NAME = 'DIP';

/** Home-screen name stays DIP. The native project and bundle id stay fitnessai. */
function withAppDisplayName(config) {
  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.CFBundleDisplayName = DISPLAY_NAME;
    // Keep CFBundleName as the native product name. Renaming it to DIP
    // would diverge from the fitnessai module and break the scene delegate.
    return plistConfig;
  });

  config = withXcodeProject(config, (projectConfig) => {
    const configurations = projectConfig.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings?.PRODUCT_NAME) {
        buildSettings.INFOPLIST_KEY_CFBundleDisplayName = DISPLAY_NAME;
      }
    }
    return projectConfig;
  });

  config = withStringsXml(config, (stringsConfig) => {
    const resources = stringsConfig.modResults.resources ?? {};
    const current = resources.string ?? [];
    const strings = Array.isArray(current) ? current : [current];
    const appName = strings.find((entry) => entry.$?.name === 'app_name');
    if (appName) {
      appName._ = DISPLAY_NAME;
    } else {
      strings.push({ $: { name: 'app_name' }, _: DISPLAY_NAME });
    }
    resources.string = strings;
    stringsConfig.modResults.resources = resources;
    return stringsConfig;
  });

  return config;
}

module.exports = withAppDisplayName;
