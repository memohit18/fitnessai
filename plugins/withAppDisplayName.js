const { withInfoPlist, withStringsXml } = require('expo/config-plugins');

const DISPLAY_NAME = 'DIP';

/** Home-screen name stays DIP. The native project and bundle id stay fitnessai. */
function withAppDisplayName(config) {
  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.CFBundleDisplayName = DISPLAY_NAME;
    plistConfig.modResults.CFBundleName = DISPLAY_NAME;
    return plistConfig;
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
