module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
      ['module:react-native-dotenv', { envName: 'APP_ENV', moduleName: '@env', path: '.env' }],
      // Must be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
