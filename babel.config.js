module.exports = function (api) {
  // Include public env in the cache key so a new .env value is inlined
  // instead of reusing a transform from before the variable existed.
  api.cache.using(() =>
    [
      process.env.EXPO_PUBLIC_APP_ENV,
      process.env.EXPO_PUBLIC_API_URL,
      process.env.EXPO_PUBLIC_AUTH_API_URL,
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
    ].join('|'),
  );
  return {
    presets: ['babel-preset-expo'],
  };
};
