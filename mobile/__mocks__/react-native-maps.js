// Manual mock for react-native-maps.
//
// react-native-maps 1.27 (SDK 57) resolves its native TurboModule eagerly at
// import time (`TurboModuleRegistry.getEnforcing`), which always throws under
// jest — there is no native binary in unit tests. This mock swaps in plain
// View-compatible components so map-rendering screens stay unit-testable.
// The polyline/bounding-region math the app owns lives in src/lib and is
// tested against the real implementation separately.

const React = require('react');
const { View, Text } = require('react-native');

const passthrough = (testIDPrefix) =>
  React.forwardRef(function MockedMapPart({ children, ...props }, ref) {
    return (
      <View ref={ref} {...props} testID={props.testID ?? testIDPrefix}>
        {children}
      </View>
    );
  });

const MapView = passthrough('map-view');
MapView.Polygon = passthrough('map-polygon');
MapView.Circle = passthrough('map-circle');
MapView.UrlTile = passthrough('map-url-tile');
MapView.Overlay = passthrough('map-overlay');
MapView.Callout = passthrough('map-callout');
MapView.Heatmap = passthrough('map-heatmap');

module.exports = {
  __esModule: true,
  default: MapView,
  Marker: passthrough('map-marker'),
  Polyline: passthrough('map-polyline'),
  Circle: passthrough('map-circle'),
  Polygon: passthrough('map-polygon'),
  Overlay: passthrough('map-overlay'),
  UrlTile: passthrough('map-url-tile'),
  Callout: passthrough('map-callout'),
  Heatmap: passthrough('map-heatmap'),
  PROVIDER_DEFAULT: 'default',
  PROVIDER_GOOGLE: 'google',
  // Some screens read these constants for styling.
  MAP_TYPES: { STANDARD: 'standard', SATELLITE: 'satellite', HYBRID: 'hybrid', TERRAIN: 'terrain' },
  Animated: MapView,
  MarkerAnimated: passthrough('map-marker'),
  PolylineAnimated: passthrough('map-polyline'),
  enableGoogleMapsServices: () => {},
  // react-native-maps also exports a <Text>-like AnimatedRegion helper.
  AnimatedRegion: class {
    constructor(value) {
      Object.assign(this, value);
    }
    setValue() {}
    stopAnimation() {}
  },
};
