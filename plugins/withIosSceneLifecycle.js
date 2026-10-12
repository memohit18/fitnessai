const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const SCENE_DELEGATE = `
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)
    appDelegate.window = window
    self.window = window

    for context in connectionOptions.urlContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
    for activity in connectionOptions.userActivities {
      _ = RCTLinkingManager.application(
        UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = RCTLinkingManager.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = RCTLinkingManager.application(
      UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

const WINDOW_BLOCK = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;

/**
 * Xcode 27 / iOS 27 abort on launch unless the app uses the UIScene lifecycle.
 */
function withIosSceneLifecycle(config) {
  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return plistConfig;
  });

  config = withAppDelegate(config, (appDelegateConfig) => {
    let contents = appDelegateConfig.modResults.contents;
    if (!contents.includes('var launchOptions:')) {
      contents = contents.replace(
        'var reactNativeFactory: RCTReactNativeFactory?\n',
        'var reactNativeFactory: RCTReactNativeFactory?\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?\n',
      );
    }
    if (!contents.includes('self.launchOptions = launchOptions')) {
      contents = contents.replace(
        ') -> Bool {\n    let delegate = ReactNativeDelegate()',
        ') -> Bool {\n    self.launchOptions = launchOptions\n\n    let delegate = ReactNativeDelegate()',
      );
    }
    if (contents.includes(WINDOW_BLOCK)) {
      contents = contents.replace(WINDOW_BLOCK, '');
    }
    if (!contents.includes('class SceneDelegate')) {
      contents = `${contents.trimEnd()}\n${SCENE_DELEGATE}`;
    }
    appDelegateConfig.modResults.contents = contents;
    return appDelegateConfig;
  });

  return config;
}

module.exports = withIosSceneLifecycle;
