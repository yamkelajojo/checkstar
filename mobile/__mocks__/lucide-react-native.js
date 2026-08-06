const React = require('react');
const { View } = require('react-native');

function MockIcon(props) {
  return React.createElement(View, props);
}

module.exports = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === '__esModule') return true;
      return MockIcon;
    },
  },
);
