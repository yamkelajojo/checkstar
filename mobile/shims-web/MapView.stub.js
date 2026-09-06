// Web stub: react-native-maps has no web implementation.
const React = require('react');
const { View } = require('react-native');
const Marker = ({ children }) => React.createElement(View, null, children);
const Polyline = () => null;
const Circle = () => null;
const UrlTile = () => null;
const Overlay = () => null;
const MapView = React.forwardRef((props, ref) =>
  React.createElement(View, { ref, ...props }, props.children)
);
module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker = Marker;
module.exports.Polyline = Polyline;
module.exports.Circle = Circle;
module.exports.UrlTile = UrlTile;
module.exports.Overlay = Overlay;
module.exports.PROVIDER_DEFAULT = 'default';
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.MAP_TYPES = {};
module.exports.Animated = MapView;
module.exports.enableGoogleMaps = () => {};
