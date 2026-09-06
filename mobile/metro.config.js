// Web-export support: react-native-maps and react-native-pager-view have no
// web implementations; reroute them to local shims when bundling for web.
// Native (iOS/Android) bundling is untouched.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native-maps') {
      return { filePath: 'shims-web/MapView.stub.js', type: 'sourceFile' };
    }
    if (moduleName === 'react-native-pager-view') {
      return { filePath: 'shims-web/PagerView.web.js', type: 'sourceFile' };
    }
  }
  if (originalResolveRequest) return originalResolveRequest(context, moduleName, platform);
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
